import { Howl } from "howler";

let _revealSounds: Howl | null = null;

function getRevealSounds(): Howl | null {
  if (typeof window === "undefined") return null;
  if (!_revealSounds) {
    _revealSounds = new Howl({
      src: ["/sounds/reveal.webm", "/sounds/reveal.mp3"],
      sprite: { chime: [0, 600] },
    });
  }
  return _revealSounds;
}

export function playChime(): void {
  getRevealSounds()?.play("chime");
}

