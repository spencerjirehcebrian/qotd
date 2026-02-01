"use client";

import { MotionConfig } from "framer-motion";

/**
 * Wraps the app in framer-motion's MotionConfig with reducedMotion="user".
 *
 * When the user's OS or browser sets prefers-reduced-motion: reduce,
 * all framer-motion animations automatically become instant (no motion).
 * No per-component opt-in is needed.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
