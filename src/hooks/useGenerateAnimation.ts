'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsapConfig';
import { useAppStore } from '@/store/useAppStore';

type SimRef = React.RefObject<{
  rotation: number;
  active: boolean;
  velocity: number;
  lastPegIndex: number;
  pointerAngle: number;
  pointerVelocity: number;
  lastTime: number;
  settling: boolean;
  settleCount: number;
}>;

/**
 * Drives a continuous GSAP spin on the wheel while `isGenerating` is true,
 * then decelerates to a stop when generation completes.
 *
 * Keeps `sim.current.rotation` in sync so the physics engine picks up from
 * the correct angle on the next user spin.
 */
export function useGenerateAnimation(
  wheelRef: React.RefObject<HTMLDivElement | null>,
  sim: SimRef,
) {
  const isGenerating = useAppStore((s) => s.isGenerating);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const proxyRef = useRef({ rotation: 0 });
  const prevGenerating = useRef(false);

  useEffect(() => {
    const wasGenerating = prevGenerating.current;
    prevGenerating.current = isGenerating;

    if (!wheelRef.current) return;

    // Detect reduced motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isGenerating && !wasGenerating) {
      // Starting generation -- begin continuous spin
      tweenRef.current?.kill();

      if (reducedMotion) {
        // No animation for reduced motion -- placeholder segments shown statically
        return;
      }

      // Sync proxy with current sim rotation
      proxyRef.current.rotation = sim.current.rotation;

      tweenRef.current = gsap.to(proxyRef.current, {
        rotation: '-=36000',
        duration: 50,
        ease: 'none',
        onUpdate: () => {
          if (wheelRef.current) {
            gsap.set(wheelRef.current, { rotation: proxyRef.current.rotation });
          }
          sim.current.rotation = proxyRef.current.rotation;
        },
      });
    } else if (!isGenerating && wasGenerating) {
      // Generation finished -- decelerate to stop
      tweenRef.current?.kill();

      if (reducedMotion) {
        return;
      }

      const currentRotation = proxyRef.current.rotation;
      // Coast ~one full turn with a longer, gentler deceleration
      const coastDistance = 200 + Math.random() * 80;

      tweenRef.current = gsap.to(proxyRef.current, {
        rotation: currentRotation - coastDistance,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: () => {
          if (wheelRef.current) {
            gsap.set(wheelRef.current, { rotation: proxyRef.current.rotation });
          }
          sim.current.rotation = proxyRef.current.rotation;
        },
        onComplete: () => {
          sim.current.rotation = proxyRef.current.rotation;
          tweenRef.current = null;
        },
      });
    }

    return () => {
      // Cleanup on unmount or dependency change
    };
  }, [isGenerating, wheelRef, sim]);

  // Cleanup all tweens on unmount
  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
    };
  }, []);

  return { isGenerating };
}
