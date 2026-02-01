"use client";

import { useRef, useCallback } from "react";
import { gsap } from "@/lib/gsapConfig";
import { DURATIONS, EASINGS } from "@/lib/motion";
import { fireRevealConfetti, resetConfetti } from "@/lib/confetti";
import { playChime } from "@/lib/revealSounds";
import { triggerHaptic, HAPTIC_REVEAL } from "@/lib/haptics";

export interface RevealRefs {
  container: HTMLDivElement | null;
  categoryLabel: HTMLElement | null;
  questionText: HTMLElement | null;
  actions: HTMLElement | null;
}

export function useRevealSequence(): {
  play: (refs: RevealRefs) => void;
  kill: () => void;
} {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const play = useCallback((refs: RevealRefs) => {
    // Kill any existing timeline
    timelineRef.current?.kill();
    timelineRef.current = null;

    // Clear stale confetti particles
    resetConfetti();

    // Null-check all refs
    const { container, categoryLabel, questionText, actions } = refs;
    if (!container || !categoryLabel || !questionText || !actions) return;

    // Create timeline (starts immediately -- no anticipation pause)
    const tl = gsap.timeline();
    timelineRef.current = tl;

    // Stage 0: Initial state
    tl.set(categoryLabel, { opacity: 0, y: 8 });
    tl.set(questionText, { clipPath: "inset(0 0 100% 0)", opacity: 0 });
    tl.set(actions, { opacity: 0, y: 8 });

    // Stage 1: Category label fade-in (starts immediately)
    tl.to(categoryLabel, {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: EASINGS.out,
    });

    // Stage 2: Question text clip-path reveal (overlaps with category)
    tl.to(
      questionText,
      {
        clipPath: "inset(0 0 0% 0)",
        opacity: 1,
        duration: 0.45,
        ease: EASINGS.inOut,
      },
      "-=0.1"
    );

    // Stage 3: Celebration effects (subtle)
    tl.call(
      () => {
        fireRevealConfetti();
        playChime();
        triggerHaptic(HAPTIC_REVEAL);
      },
      [],
      "<0.2"
    );

    // Stage 4: Actions fade-in
    tl.to(
      actions,
      {
        opacity: 1,
        y: 0,
        duration: DURATIONS.normal,
        ease: EASINGS.out,
      },
      "-=0.15"
    );
  }, []);

  const kill = useCallback(() => {
    timelineRef.current?.kill();
    timelineRef.current = null;
  }, []);

  return { play, kill };
}
