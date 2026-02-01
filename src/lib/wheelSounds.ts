/**
 * Wheel audio feedback using Howler.js audio sprites.
 *
 * Lazy-initializes the Howl instance to avoid SSR issues.
 * Provides throttled tick playback to prevent audio glitching
 * at high spin velocities.
 *
 * Audio sprite layout (in wheel.webm / wheel.mp3):
 *   tick: [0ms, 50ms]  -- short click on segment cross
 *   land: [100ms, 400ms] -- thud when wheel lands on final segment
 */

import { Howl } from "howler";

let _wheelSounds: Howl | null = null;

function getWheelSounds(): Howl | null {
  if (typeof window === "undefined") return null;

  if (!_wheelSounds) {
    _wheelSounds = new Howl({
      src: ["/sounds/wheel.webm", "/sounds/wheel.mp3"],
      sprite: {
        tick: [0, 50],
        land: [100, 400],
      },
    });
  }
  return _wheelSounds;
}

let lastTickTime = 0;
const MIN_TICK_INTERVAL = 30; // ms -- throttle at high spin speed

/** Play a short tick sound on segment cross. Throttled to prevent audio glitching. */
export function playTick(): void {
  const now = performance.now();
  if (now - lastTickTime < MIN_TICK_INTERVAL) return;
  lastTickTime = now;
  getWheelSounds()?.play("tick");
}

/** Play the landing sound when wheel settles on final segment. Not throttled. */
export function playLand(): void {
  getWheelSounds()?.play("land");
}

