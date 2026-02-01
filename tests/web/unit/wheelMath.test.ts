import { describe, it, expect } from 'vitest';
import { createWheelPath } from '@/utils/wheelMath';

describe('createWheelPath', () => {
  it('returns a valid SVG path string', () => {
    const path = createWheelPath(100, 100, 80, 0, 90);
    expect(path).toContain('M 100 100');
    expect(path).toContain('L');
    expect(path).toContain('A');
    expect(path).toContain('Z');
  });

  it('uses large-arc-flag 0 for segments <= 180 degrees', () => {
    const path = createWheelPath(0, 0, 50, 0, 90);
    // The arc command: A rx ry x-rotation large-arc-flag sweep-flag x y
    expect(path).toMatch(/A 50 50 0 0 1/);
  });

  it('uses large-arc-flag 1 for segments > 180 degrees', () => {
    const path = createWheelPath(0, 0, 50, 0, 270);
    expect(path).toMatch(/A 50 50 0 1 1/);
  });

  it('computes correct start coordinates for 0-degree start', () => {
    const path = createWheelPath(100, 100, 50, 0, 90);
    // cos(0)=1, sin(0)=0 => start at (150, 100)
    expect(path).toContain('L 150 100');
  });

  it('computes correct end coordinates for 90-degree end', () => {
    const path = createWheelPath(100, 100, 50, 0, 90);
    // cos(90deg)=~0, sin(90deg)=1 => end near (100, 150)
    // Use regex to extract end coords from arc command
    const arcMatch = path.match(/A 50 50 0 \d 1 ([\d.e+-]+) ([\d.e+-]+)/);
    expect(arcMatch).not.toBeNull();
    const x2 = parseFloat(arcMatch![1]);
    const y2 = parseFloat(arcMatch![2]);
    expect(x2).toBeCloseTo(100, 5);
    expect(y2).toBeCloseTo(150, 5);
  });
});
