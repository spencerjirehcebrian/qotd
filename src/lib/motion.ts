/**
 * Named motion presets for consistent animation language across the app.
 *
 * Tweens are consumed by framer-motion's `transition` prop.
 * Durations are shared between framer-motion tweens and GSAP.
 * Easings are GSAP easing strings for use with gsap.to / gsap.timeline.
 */

/** Tween presets for framer-motion (no bouncy springs) */
export const TWEENS = {
  /** Micro-interactions: buttons, toggles, hovers -- fast and crisp */
  snappy: { type: "tween" as const, duration: 0.15, ease: [0.25, 0.1, 0.25, 1] },
  /** Standard UI transitions: panels, cards, drawers */
  gentle: { type: "tween" as const, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  /** Dramatic reveals: modals, hero elements, page transitions */
  dramatic: { type: "tween" as const, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  /** Playful motion: wheel spin, celebrations */
  bouncy: { type: "tween" as const, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] },
} as const;

/** Keep springs as alias for backward compat in any remaining references */
export const SPRINGS = TWEENS;

/** Duration presets in seconds -- ~30% shorter than before */
export const DURATIONS = {
  /** State changes that should feel immediate */
  instant: 0.07,
  /** Micro-feedback: hover, active, focus ring */
  fast: 0.14,
  /** Standard transitions: fade, slide, scale */
  normal: 0.28,
  /** Meaningful transitions: route change, panel swap */
  slow: 0.5,
  /** Reveal sequences: hero entry, staggered lists */
  dramatic: 0.85,
} as const;

/** GSAP easing strings -- use with gsap.to({ ease: easings.out }) */
export const EASINGS = {
  /** Standard deceleration -- elements settling into place */
  out: "power2.out",
  /** Symmetric acceleration-deceleration -- repositioning, morphing */
  inOut: "power2.inOut",
  /** Gentle overshoot -- elements that pop into view (reduced from 1.7) */
  back: "back.out(1.2)",
  /** Soft settle -- replaces elastic for gentler feel */
  elastic: "power2.out",
} as const;
