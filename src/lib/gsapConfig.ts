"use client";

/**
 * Central GSAP configuration -- always import gsap, useGSAP,
 * and InertiaPlugin from here.
 *
 * This module registers all GSAP plugins once on import, ensuring
 * SSR-safe React integration. Importing gsap directly from "gsap"
 * elsewhere would skip plugin registration.
 *
 * Registered plugins:
 *   - useGSAP: React lifecycle-safe GSAP integration
 *   - InertiaPlugin: Friction-based momentum for programmatic spin
 *
 * For GSAP animations, use gsap.matchMedia() in each component to
 * respect prefers-reduced-motion:
 *
 *   const mm = gsap.matchMedia();
 *   mm.add("(prefers-reduced-motion: no-preference)", () => {
 *     gsap.to(target, { x: 100, duration: durations.normal, ease: easings.out });
 *   });
 *
 * See 04-RESEARCH.md Pattern 3 for a full example.
 */

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { InertiaPlugin } from "gsap/InertiaPlugin";

gsap.registerPlugin(useGSAP, InertiaPlugin);

export { gsap, useGSAP, InertiaPlugin };
