"use client";

/**
 * Custom physics engine for the spinning wheel.
 *
 * Instead of GSAP InertiaPlugin (which produces clean, "rigged"-feeling
 * deceleration), this uses a manual simulation loop with:
 *
 * - Angular velocity + base friction
 * - Peg collision detection: pointer hitting pegs at segment boundaries
 *   steals energy from the wheel (flapper drag)
 * - Speed-dependent pointer deflection (spring-damped)
 * - Imperfect landing: wheel stops wherever physics dictate, no snap-to-center
 * - Multi-bounce damped settle when the pointer catches the last peg
 *
 * The pointer angle is exposed so the pointer component can render it.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { gsap } from "@/lib/gsapConfig";

/* ------------------------------------------------------------------ */
/*  Tuning constants                                                   */
/* ------------------------------------------------------------------ */

/** Base friction coefficient (energy lost per second as a multiplier) */
const BASE_FRICTION = 0.97;

/** Extra drag applied each time the pointer crosses a peg */
const PEG_DRAG_IMPULSE = 18;

/** Below this velocity (deg/s), the wheel is "nearly stopped" */
const SETTLE_THRESHOLD = 30;

/** Below this velocity, we consider the wheel fully stopped */
const STOP_THRESHOLD = 1.5;

/** Pointer spring stiffness (higher = snappier return) */
const POINTER_STIFFNESS = 600;

/** Pointer spring damping */
const POINTER_DAMPING = 28;

/** Max pointer deflection in degrees */
const POINTER_MAX_DEFLECTION = 35;

/** How much the pointer deflects per unit of wheel velocity at a peg hit */
const POINTER_DEFLECTION_FACTOR = 0.025;

/** Min initial velocity (deg/s) */
const MIN_VELOCITY = 900;
/** Max initial velocity (deg/s) */
const MAX_VELOCITY = 2400;

/** When settling, if the wheel rocks below this amplitude, stop */
const SETTLE_AMPLITUDE_THRESHOLD = 0.3;

export interface UseWheelPhysicsOptions {
  segmentCount: number;
  onSegmentCross: (segmentIndex: number) => void;
  onSpinStart?: () => void;
  onSpinComplete: (segmentIndex: number) => void;
  enabled?: boolean;
  /** Multiplier for initial velocity range. 1.0 = default. */
  velocityScale?: number;
  /** Override base friction coefficient. Default uses BASE_FRICTION (0.97). */
  friction?: number;
}

export interface UseWheelPhysicsReturn {
  wheelRef: React.RefObject<HTMLDivElement | null>;
  spin: () => void;
  isSpinning: boolean;
  /** Current pointer deflection angle (degrees). Positive = clockwise deflection. */
  pointerAngle: number;
  /** Mutable simulation state ref -- used by generate animation to sync rotation. */
  sim: React.RefObject<{
    active: boolean;
    rotation: number;
    velocity: number;
    lastPegIndex: number;
    pointerAngle: number;
    pointerVelocity: number;
    lastTime: number;
    settling: boolean;
    settleCount: number;
  }>;
}

export function useWheelPhysics({
  segmentCount,
  onSegmentCross,
  onSpinStart,
  onSpinComplete,
  enabled = true,
  velocityScale = 1,
  friction,
}: UseWheelPhysicsOptions): UseWheelPhysicsReturn {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pointerAngle, setPointerAngle] = useState(0);

  // Mutable simulation state (not in React state to avoid re-renders each frame)
  const sim = useRef({
    active: false,
    rotation: 0,
    velocity: 0,
    lastPegIndex: -1,
    pointerAngle: 0,
    pointerVelocity: 0,
    lastTime: 0,
    settling: false,
    settleCount: 0,
  });

  const segmentAngle = segmentCount > 0 ? 360 / segmentCount : 360;

  // Callbacks stored in refs to avoid stale closures in the animation loop
  const onSegmentCrossRef = useRef(onSegmentCross);
  const onSpinCompleteRef = useRef(onSpinComplete);
  const onSpinStartRef = useRef(onSpinStart);
  useEffect(() => { onSegmentCrossRef.current = onSegmentCross; }, [onSegmentCross]);
  useEffect(() => { onSpinCompleteRef.current = onSpinComplete; }, [onSpinComplete]);
  useEffect(() => { onSpinStartRef.current = onSpinStart; }, [onSpinStart]);

  const segmentAngleRef = useRef(segmentAngle);
  useEffect(() => { segmentAngleRef.current = segmentAngle; }, [segmentAngle]);

  const velocityScaleRef = useRef(velocityScale);
  useEffect(() => { velocityScaleRef.current = velocityScale; }, [velocityScale]);

  const frictionRef = useRef(friction ?? BASE_FRICTION);
  useEffect(() => { frictionRef.current = friction ?? BASE_FRICTION; }, [friction]);

  // Use a ref for the step function to break the self-reference cycle
  const stepRef = useRef<((time: number) => void) | undefined>(undefined);

  useEffect(() => {
    const stopSim = (finalRotation: number) => {
      sim.current.active = false;
      setIsSpinning(false);
      const sa = segmentAngleRef.current;
      const normalized = ((-finalRotation % 360) + 360) % 360;
      const segIdx = Math.floor(normalized / sa);
      onSpinCompleteRef.current(segIdx);
    };

    stepRef.current = (time: number) => {
      const s = sim.current;
      if (!s.active) return;

      const dt = Math.min((time - s.lastTime) / 1000, 0.05);
      s.lastTime = time;

      if (dt <= 0) {
        requestAnimationFrame((t) => stepRef.current?.(t));
        return;
      }

      // --- Wheel physics ---
      // Apply base friction (exponential decay)
      s.velocity *= Math.pow(frictionRef.current, dt * 60);

      // Check peg crossing
      const sa = segmentAngleRef.current;
      const normalized = ((s.rotation % 360) + 360) % 360;
      const currentPeg = Math.floor(normalized / sa);

      if (currentPeg !== s.lastPegIndex && s.lastPegIndex !== -1) {
        // Peg hit! Apply drag impulse
        const dragAmount = Math.min(PEG_DRAG_IMPULSE, Math.abs(s.velocity) * 0.08);
        s.velocity -= Math.sign(s.velocity) * dragAmount;

        // Deflect pointer -- amount depends on wheel speed
        const speed = Math.abs(s.velocity);
        const deflection = Math.min(
          POINTER_MAX_DEFLECTION,
          speed * POINTER_DEFLECTION_FACTOR + 5
        );
        s.pointerVelocity -= deflection * 30;

        // Fire segment cross callback
        const normRot = ((-s.rotation % 360) + 360) % 360;
        const segIdx = Math.floor(normRot / sa);
        onSegmentCrossRef.current(segIdx);
      }
      s.lastPegIndex = currentPeg;

      // Advance wheel rotation
      s.rotation += s.velocity * dt;

      // --- Pointer spring physics ---
      const springForce = -POINTER_STIFFNESS * s.pointerAngle;
      const dampingForce = -POINTER_DAMPING * s.pointerVelocity;
      s.pointerVelocity += (springForce + dampingForce) * dt;
      s.pointerAngle += s.pointerVelocity * dt;
      s.pointerAngle = Math.max(
        -POINTER_MAX_DEFLECTION,
        Math.min(POINTER_MAX_DEFLECTION, s.pointerAngle)
      );

      // --- Settling detection ---
      const absVel = Math.abs(s.velocity);
      if (absVel < SETTLE_THRESHOLD && !s.settling) {
        s.settling = true;
      }

      if (absVel < STOP_THRESHOLD) {
        if (
          Math.abs(s.pointerAngle) < SETTLE_AMPLITUDE_THRESHOLD &&
          Math.abs(s.pointerVelocity) < 5
        ) {
          if (wheelRef.current) {
            gsap.set(wheelRef.current, { rotation: s.rotation });
          }
          setPointerAngle(s.pointerAngle);
          stopSim(s.rotation);
          return;
        }
        s.velocity = 0;
      }

      // --- Apply to DOM ---
      if (wheelRef.current) {
        gsap.set(wheelRef.current, { rotation: s.rotation });
      }
      setPointerAngle(s.pointerAngle);

      requestAnimationFrame((t) => stepRef.current?.(t));
    };
  });

  // Set transform origin on mount
  useEffect(() => {
    if (!wheelRef.current || !enabled || segmentCount <= 0) return;
    gsap.set(wheelRef.current, { transformOrigin: "50% 50%" });
  }, [segmentCount, enabled]);

  const spin = useCallback(() => {
    if (sim.current.active || !wheelRef.current) return;

    // Kill any existing GSAP tweens (idle animation etc.)
    gsap.killTweensOf(wheelRef.current);

    const scale = velocityScaleRef.current;
    const velocity = (MIN_VELOCITY + Math.random() * (MAX_VELOCITY - MIN_VELOCITY)) * scale;

    const s = sim.current;
    s.active = true;
    s.velocity = velocity;
    const sa = segmentAngleRef.current;
    const normalized = ((s.rotation % 360) + 360) % 360;
    s.lastPegIndex = Math.floor(normalized / sa);
    s.pointerAngle = 0;
    s.pointerVelocity = 0;
    s.lastTime = performance.now();
    s.settling = false;
    s.settleCount = 0;

    setIsSpinning(true);
    setPointerAngle(0);
    onSpinStartRef.current?.();

    requestAnimationFrame((t) => stepRef.current?.(t));
  }, []);

  return { wheelRef, spin, isSpinning, pointerAngle, sim };
}
