import { describe, it, expect } from 'vitest';
import {
  getCategoryToken,
  getCategoryColor,
  getCategoryHex,
  getFallbackHex,
} from '@/lib/categoryColors';

describe('getCategoryToken', () => {
  it('maps known category names to tokens', () => {
    expect(getCategoryToken('Preferences')).toBe('cat-preferences');
    expect(getCategoryToken('What If')).toBe('cat-whatif');
    expect(getCategoryToken('Hot Takes')).toBe('cat-hottakes');
    expect(getCategoryToken('Backstory')).toBe('cat-backstory');
    expect(getCategoryToken('Real Talk')).toBe('cat-realtalk');
    expect(getCategoryToken('Just for Fun')).toBe('cat-justforfun');
    expect(getCategoryToken('Desert Island')).toBe('cat-desertisland');
    expect(getCategoryToken('Wildcard')).toBe('cat-wildcard');
  });

  it('maps legacy category name aliases to the same tokens', () => {
    expect(getCategoryToken('Favorites & Firsts')).toBe('cat-preferences');
    expect(getCategoryToken('Origin Story')).toBe('cat-backstory');
  });

  it('returns "muted" for unknown names', () => {
    expect(getCategoryToken('Unknown Category')).toBe('muted');
    expect(getCategoryToken('')).toBe('muted');
  });
});

describe('getCategoryColor', () => {
  it('returns hex string for known names', () => {
    expect(getCategoryColor('Hot Takes')).toBe('#e0b3cc');
    expect(getCategoryColor('Preferences')).toBe('#b3c8e0');
  });

  it('returns fallback hex for unknown names', () => {
    expect(getCategoryColor('Nope')).toBe('#78716c');
  });
});

describe('getCategoryHex', () => {
  it('returns correct hex for known names', () => {
    expect(getCategoryHex('Preferences')).toBe('#b3c8e0');
    expect(getCategoryHex('Wildcard')).toBe('#e0c4b3');
  });

  it('returns fallback hex for unknown names', () => {
    expect(getCategoryHex('???')).toBe('#c9d5e0');
  });
});

describe('getFallbackHex', () => {
  it('returns hex from array by index', () => {
    expect(getFallbackHex(0)).toBe('#c9d5e0');
    expect(getFallbackHex(1)).toBe('#d5c9e0');
  });

  it('wraps around when index exceeds array length', () => {
    expect(getFallbackHex(7)).toBe('#c9d5e0'); // 7 % 7 = 0
    expect(getFallbackHex(8)).toBe('#d5c9e0'); // 8 % 7 = 1
  });
});
