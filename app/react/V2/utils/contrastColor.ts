/**
 * Walk up the DOM tree until a non-transparent background-color is found.
 * Handles any ancestor depth: direct element, parent, grandparent, etc.
 */
function resolveBackgroundColor(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg;
    node = node.parentElement;
  }
  return 'rgb(255, 255, 255)'; // fallback: assume white
}

/** WCAG relative luminance of a single sRGB channel value (0–255). */
function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of an rgb(...) or rgba(...) string (0 = black, 1 = white). */
function getLuminance(rgbString: string): number {
  const [r, g, b] = (rgbString.match(/\d+/g) ?? ['255', '255', '255']).map(Number);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

const GRADIENT_COLOR = /(#[\da-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/gi;

const gradientEdgeColor = (gradient: string, edge: 'start' | 'end'): string => {
  const colors = gradient.match(GRADIENT_COLOR) ?? [];
  if (colors.length === 0) return 'rgb(255, 255, 255)';
  const pick = edge === 'start' ? colors[0] : colors[colors.length - 1];
  return pick ?? 'rgb(255, 255, 255)';
};

const resolveChromeSurfaceColor = (
  el: HTMLElement,
  edge: 'start' | 'end',
  fallback: 'start' | 'end' = edge
): string => {
  let node: HTMLElement | null = el;
  while (node) {
    const { backgroundColor, backgroundImage } = getComputedStyle(node);
    if (backgroundImage && backgroundImage !== 'none' && backgroundImage.includes('gradient')) {
      return gradientEdgeColor(backgroundImage, edge);
    }
    if (
      backgroundColor &&
      backgroundColor !== 'transparent' &&
      backgroundColor !== 'rgba(0, 0, 0, 0)'
    ) {
      return backgroundColor;
    }
    node = node.parentElement;
  }
  return fallback === 'start' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
};

/** Color to fade into when the beacon rail expands on custom legacy headers. */
const resolveChromeFadeColor = (el: HTMLElement): string => resolveChromeSurfaceColor(el, 'end');

/** Color used to pick readable text on custom legacy headers. */
const resolveChromeTextColor = (el: HTMLElement): string => resolveChromeSurfaceColor(el, 'start');

/**
 * Returns 'white' or 'black' — whichever achieves the higher WCAG contrast
 * ratio against the given background color string.
 */
function getContrastColor(bgColor: string): 'white' | 'black' {
  const bgL = getLuminance(bgColor);
  const whiteContrast = 1.05 / (bgL + 0.05);
  const blackContrast = (bgL + 0.05) / 0.05;
  return whiteContrast >= blackContrast ? 'white' : 'black';
}

export {
  resolveBackgroundColor,
  resolveChromeFadeColor,
  resolveChromeTextColor,
  getLuminance,
  getContrastColor,
};
