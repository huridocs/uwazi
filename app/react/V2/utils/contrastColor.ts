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
const parseRgbChannels = (color: string): [number, number, number] | null => {
  const match = color.trim().match(/^rgba?\(\s*([^)]+)\)$/i);
  if (!match) return null;
  const [r, g, b] = match[1].split(',').map(part => Number.parseFloat(part.trim()));
  if ([r, g, b].some(channel => Number.isNaN(channel))) return null;
  return [r, g, b];
};

const parseHexChannels = (color: string): [number, number, number] | null => {
  const raw = color.trim().replace(/^#/, '');
  if (raw.length === 3) {
    return [
      Number.parseInt(raw[0] + raw[0], 16),
      Number.parseInt(raw[1] + raw[1], 16),
      Number.parseInt(raw[2] + raw[2], 16),
    ];
  }
  if (raw.length === 6 || raw.length === 8) {
    return [
      Number.parseInt(raw.slice(0, 2), 16),
      Number.parseInt(raw.slice(2, 4), 16),
      Number.parseInt(raw.slice(4, 6), 16),
    ];
  }
  return null;
};

const hslHueToRgb = (huePrime: number, chroma: number, x: number): [number, number, number] => {
  const hueRgb: ReadonlyArray<readonly [number, number, number]> = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ];
  const [r, g, b] = hueRgb[Math.min(5, Math.floor(huePrime))];
  return [r, g, b];
};

const hslToRgbChannels = (
  hue: number,
  saturation: number,
  lightness: number
): [number, number, number] | null => {
  if ([hue, saturation, lightness].some(value => Number.isNaN(value))) return null;

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const huePrime = hue / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  const [r, g, b] = hslHueToRgb(huePrime, chroma, x);
  const lightnessOffset = lightness - chroma / 2;

  return [
    Math.round((r + lightnessOffset) * 255),
    Math.round((g + lightnessOffset) * 255),
    Math.round((b + lightnessOffset) * 255),
  ];
};

const parseHslChannels = (color: string): [number, number, number] | null => {
  const match = color.trim().match(/^hsla?\(\s*([^)]+)\)$/i);
  if (!match) return null;
  const parts = match[1]
    .split(/[,\s/]+/)
    .map(part => part.trim())
    .filter(Boolean);
  if (parts.length < 3) return null;

  const hue = Number.parseFloat(parts[0]);
  const saturation = Number.parseFloat(parts[1].replace('%', '')) / 100;
  const lightness = Number.parseFloat(parts[2].replace('%', '')) / 100;
  return hslToRgbChannels(hue, saturation, lightness);
};

const probeColorChannels = (color: string): [number, number, number] | null => {
  if (typeof document === 'undefined') return null;

  const probe = document.createElement('div');
  probe.style.color = color;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return parseRgbChannels(resolved);
};

const parseColorChannels = (color: string): [number, number, number] => {
  const parsers = [parseRgbChannels, parseHexChannels, parseHslChannels];
  for (const parse of parsers) {
    const channels = parse(color);
    if (channels) return channels;
  }

  return probeColorChannels(color) ?? [255, 255, 255];
};

function getLuminance(color: string): number {
  const [r, g, b] = parseColorChannels(color);
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
