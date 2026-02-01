/**
 * UI interaction sounds using Howler.js.
 *
 * Lazy-initializes Howl instances to avoid SSR issues.
 *
 * generate.webm / generate.mp3: three quick ascending knocks (~200ms)
 */

import { Howl } from "howler";

/* ── Generate questions ── */

let _generateSound: Howl | null = null;

function getGenerateSound(): Howl | null {
  if (typeof window === "undefined") return null;
  if (!_generateSound) {
    _generateSound = new Howl({
      src: ["/sounds/generate.webm", "/sounds/generate.mp3"],
    });
  }
  return _generateSound;
}

/** Play the generate-questions shuffle sound. */
export function playGenerate(): void {
  getGenerateSound()?.play();
}
