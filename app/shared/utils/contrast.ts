const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '').trim();
  const full =
    h.length === 3
      ? h
          .split('')
          .map(x => x + x)
          .join('')
      : h;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
};

const rgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b]
    .map(x =>
      Math.round(Math.max(0, Math.min(1, x)) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;

const mixHex = (hex1: string, hex2: string, weight: number): string => {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const w = Math.max(0, Math.min(1, weight));
  return rgbToHex(r1 + (r2 - r1) * w, g1 + (g2 - g1) * w, b1 + (b2 - b1) * w);
};

const linearize = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

const relativeLuminance = (r: number, g: number, b: number): number =>
  0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);

const contrastRatio = (L1: number, L2: number): number =>
  (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);

const getContrastRatio = (hex1: string, hex2: string): number => {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const L1 = relativeLuminance(r1, g1, b1);
  const L2 = relativeLuminance(r2, g2, b2);
  return contrastRatio(L1, L2);
};

const getRelativeLuminanceFromHex = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex);
  return relativeLuminance(r, g, b);
};

const WCAG_AA = 4.5;
const WCAG_AA_LARGE_UI = 3;
const WCAG_AAA = 7;

interface ContrastCheck {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
}

const checkContrast = (bgHex: string, fgHex: string): ContrastCheck => {
  const ratio = getContrastRatio(bgHex, fgHex);
  return { ratio, passesAA: ratio >= WCAG_AA, passesAAA: ratio >= WCAG_AAA };
};

const hexRe = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const rgbRe = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/;

const parseColorToHex = (value: string): string | null => {
  const s = value.trim();
  if (hexRe.test(s)) {
    const h = s.replace('#', '');
    return h.length === 3
      ? `#${h
          .split('')
          .map(c => c + c)
          .join('')}`
      : `#${h}`;
  }
  const rgb = rgbRe.exec(s);
  if (rgb) {
    return rgbToHex(Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255);
  }
  return null;
};

const THEME_ROOT_SELECTOR = '[data-theme-custom]';

const resolveCssVarToHex = (varName: string, root: Element | null = null): string | null => {
  if (typeof document === 'undefined') return null;
  const el = root ?? document.querySelector(THEME_ROOT_SELECTOR) ?? document.documentElement;
  const value = getComputedStyle(el).getPropertyValue(varName.trim()).trim();
  if (!value) return null;
  return parseColorToHex(value);
};

const checkThemeContrast = (
  bgVar: string,
  fgVar: string,
  root: Element | null = null
): ContrastCheck | null => {
  const bg = resolveCssVarToHex(bgVar, root);
  const fg = resolveCssVarToHex(fgVar, root);
  if (bg === null || fg === null) return null;
  return checkContrast(bg, fg);
};

const getContrastTextColor = (backgroundHex: string): string => {
  if (!backgroundHex) return '#1A1A1A';
  const [r, g, b] = hexToRgb(backgroundHex);
  const bgL = relativeLuminance(r, g, b);
  const blackL = 0;
  const whiteL = 1;
  const ratioOnBlack = contrastRatio(bgL, blackL);
  const ratioOnWhite = contrastRatio(bgL, whiteL);
  return ratioOnBlack >= ratioOnWhite ? '#1A1A1A' : '#FFFFFF';
};

// eslint-disable-next-line max-statements
const getAccessibleColorPair = (backgroundHex: string) => {
  const foreground = getContrastTextColor(backgroundHex);
  const contrast = checkContrast(backgroundHex, foreground);
  if (contrast.passesAA) {
    return { background: backgroundHex, foreground, ratio: contrast.ratio };
  }

  const target = foreground === '#FFFFFF' ? '#000000' : '#FFFFFF';

  for (let step = 1; step <= 20; step += 1) {
    const background = mixHex(backgroundHex, target, step / 20);
    const nextForeground = getContrastTextColor(background);
    const nextContrast = checkContrast(background, nextForeground);
    if (nextContrast.passesAA) {
      return { background, foreground: nextForeground, ratio: nextContrast.ratio };
    }
  }

  return { background: backgroundHex, foreground, ratio: contrast.ratio };
};

// eslint-disable-next-line max-statements
const getAccessibleForegroundOnBackground = (
  backgroundHex: string,
  preferredHex: string,
  minimumRatio = WCAG_AA
) => {
  const contrast = checkContrast(backgroundHex, preferredHex);
  if (contrast.ratio >= minimumRatio) {
    return { foreground: preferredHex, ratio: contrast.ratio };
  }

  const blackContrast = checkContrast(backgroundHex, '#1A1A1A');
  const whiteContrast = checkContrast(backgroundHex, '#FFFFFF');
  const target = blackContrast.ratio >= whiteContrast.ratio ? '#1A1A1A' : '#FFFFFF';

  for (let step = 1; step <= 20; step += 1) {
    const foreground = mixHex(preferredHex, target, step / 20);
    const nextContrast = checkContrast(backgroundHex, foreground);
    if (nextContrast.ratio >= minimumRatio) {
      return { foreground, ratio: nextContrast.ratio };
    }
  }

  return { foreground: target, ratio: checkContrast(backgroundHex, target).ratio };
};

const getTemplatePillColors = (
  accentHex: string,
  tintBaseHex: string,
  minimumRatio = WCAG_AA
): { background: string; foreground: string; ratio: number } => {
  for (let step = 1; step <= 100; step += 1) {
    const w = step / 100;
    const background = mixHex(tintBaseHex, accentHex, w);
    const next = checkContrast(background, accentHex);
    if (next.ratio >= minimumRatio) {
      return { background, foreground: accentHex, ratio: next.ratio };
    }
  }

  const background = mixHex(tintBaseHex, accentHex, 0.22);
  const adjusted = getAccessibleForegroundOnBackground(background, accentHex, minimumRatio);
  return { background, foreground: adjusted.foreground, ratio: adjusted.ratio };
};

export {
  hexToRgb,
  rgbToHex,
  mixHex,
  getContrastRatio,
  checkContrast,
  parseColorToHex,
  resolveCssVarToHex,
  checkThemeContrast,
  getContrastTextColor,
  getAccessibleColorPair,
  getAccessibleForegroundOnBackground,
  getTemplatePillColors,
  getRelativeLuminanceFromHex,
  WCAG_AA_LARGE_UI,
};
