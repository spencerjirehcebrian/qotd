"use client";

/**
 * React hook wrapping wheel sound effects.
 *
 * Returns callbacks suitable for passing directly to useWheelPhysics:
 *   - onSegmentCross: plays a throttled tick sound
 *   - onLand: plays the landing sound
 *
 * Throttling logic lives in wheelSounds.ts to keep this hook thin.
 */

import { useCallback } from "react";
import { playTick, playLand } from "@/lib/wheelSounds";

export interface UseWheelSoundReturn {
  /** Pass as onSegmentCross callback to useWheelPhysics */
  onSegmentCross: (segmentIndex: number) => void;
  /** Call when the wheel lands on a final segment */
  onLand: () => void;
}

export function useWheelSound(): UseWheelSoundReturn {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSegmentCross = useCallback((_segmentIndex: number) => {
    playTick();
  }, []);

  const onLand = useCallback(() => {
    playLand();
  }, []);

  return { onSegmentCross, onLand };
}
