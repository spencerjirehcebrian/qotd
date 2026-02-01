export function triggerHaptic(pattern: number | number[] = 100): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail -- not all environments support vibration
    }
  }
}

export const HAPTIC_REVEAL: number[] = [50, 30, 100];
