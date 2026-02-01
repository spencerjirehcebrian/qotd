import confetti from "canvas-confetti";

export function fireRevealConfetti(): void {
  confetti({
    particleCount: 15,
    spread: 50,
    origin: { x: 0.5, y: 0.45 },
    colors: ["#b8c4d0", "#c4b8d0", "#b8d0c4", "#d0c4b8", "#c4d0b8"],
    disableForReducedMotion: true,
    zIndex: 9999,
    scalar: 0.8,
  });
}

export function resetConfetti(): void {
  confetti.reset();
}
