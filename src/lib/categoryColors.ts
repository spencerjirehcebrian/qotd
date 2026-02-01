/**
 * Category name to color mapping.
 *
 * Two getters:
 * - getCategoryColor()  -> hex string for HTML inline styles (borders, text color)
 * - getCategoryHex()    -> hex string for SVG fill/stroke attributes
 *
 * getCategoryColor returns more saturated values suitable for borders/text,
 * while getCategoryHex returns softer pastels for wheel segment fills.
 */

const CATEGORY_TOKEN_MAP: Record<string, string> = {
  'Preferences': 'cat-preferences',
  'Favorites & Firsts': 'cat-preferences',
  'What If': 'cat-whatif',
  'Hot Takes': 'cat-hottakes',
  'Backstory': 'cat-backstory',
  'Origin Story': 'cat-backstory',
  'Real Talk': 'cat-realtalk',
  'Just for Fun': 'cat-justforfun',
  'Desert Island': 'cat-desertisland',
  'Wildcard': 'cat-wildcard',
};

/** Soft pastel hex values for borders, text, and UI accents */
const CATEGORY_COLOR_MAP: Record<string, string> = {
  'Preferences': '#b3c8e0',       // blue
  'Favorites & Firsts': '#b3c8e0',
  'What If': '#ccb3e0',           // violet
  'Hot Takes': '#e0b3cc',         // pink
  'Backstory': '#b3e0c8',         // green
  'Origin Story': '#b3e0c8',
  'Real Talk': '#e0c8b3',         // peach
  'Just for Fun': '#ddd9b3',      // gold
  'Desert Island': '#b3d8e0',     // cyan
  'Wildcard': '#e0c4b3',          // orange
};

/** Pastel hex values for wheel segment fills */
const CATEGORY_HEX_MAP: Record<string, string> = {
  'Preferences': '#b3c8e0',
  'Favorites & Firsts': '#b3c8e0',
  'What If': '#ccb3e0',
  'Hot Takes': '#e0b3cc',
  'Backstory': '#b3e0c8',
  'Origin Story': '#b3e0c8',
  'Real Talk': '#e0c8b3',
  'Just for Fun': '#ddd9b3',
  'Desert Island': '#b3d8e0',
  'Wildcard': '#e0c4b3',
};

/** Darker, more vivid hex values for prominent text (e.g. reveal overlay) */
const CATEGORY_VIVID_MAP: Record<string, string> = {
  'Preferences': '#4a7ab5',
  'Favorites & Firsts': '#4a7ab5',
  'What If': '#7a5ab5',
  'Hot Takes': '#b5567a',
  'Backstory': '#3a9a6e',
  'Origin Story': '#3a9a6e',
  'Real Talk': '#b56a4a',
  'Just for Fun': '#a8922e',
  'Desert Island': '#3a8fa0',
  'Wildcard': '#b57a3a',
};

const FALLBACK_HEX = [
  '#c9d5e0', '#d5c9e0', '#c9e0d5', '#e0d5c9',
  '#d5e0c9', '#e0c9d5', '#c9e0e0',
];

export function getCategoryToken(name: string): string {
  return CATEGORY_TOKEN_MAP[name] ?? 'muted';
}

/** Vibrant hex color -- use for borders, text, and UI accents */
export function getCategoryColor(name: string): string {
  return CATEGORY_COLOR_MAP[name] ?? '#78716c';
}

/** Softer pastel hex color -- use for SVG fills and backgrounds */
export function getCategoryHex(name: string): string {
  return CATEGORY_HEX_MAP[name] ?? '#c9d5e0';
}

/** Darker vivid hex color -- use for prominent text like the reveal overlay */
export function getCategoryVividColor(name: string): string {
  return CATEGORY_VIVID_MAP[name] ?? '#5a5550';
}

/** Fallback hex by index for segments with no category */
export function getFallbackHex(index: number): string {
  return FALLBACK_HEX[index % FALLBACK_HEX.length];
}
