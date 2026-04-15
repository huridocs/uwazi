import {
  FALLBACK_HEX,
  clamp,
  hexToRgb,
  hslHex,
  normalizeBaseHex,
  rgbToHsl,
} from './colorSpaceForPalette.js';

const pushNeutralRamp = (h0: number, add: (h: number, s: number, l: number) => void) => {
  for (let L = 4; L <= 96; L += 4) add(h0, 0, L);
};

const pushChromaticRing = (
  h0: number,
  s0: number,
  l0: number,
  add: (h: number, s: number, l: number) => void
) => {
  for (let i = 0; i <= 10; i += 1) add(h0, clamp(s0 * (0.55 + i * 0.045), 5, 100), 8 + i * 8);
  const hueSteps = [-120, -90, -72, -48, -30, -18, 18, 30, 48, 72, 90, 120, 150, 180];
  for (const dh of hueSteps) {
    const ad = Math.abs(dh);
    let satScale = 0.9;
    if (ad > 100) satScale = 0.5;
    else if (ad > 60) satScale = 0.72;
    add(h0 + dh, clamp(s0 * satScale, 8, 100), clamp(l0 - 14, 10, 88));
    add(h0 + dh, clamp(s0 * satScale * 0.62, 8, 95), clamp(l0 + 10, 12, 92));
    add(h0 + dh, clamp(s0 * satScale * 0.35, 6, 80), clamp(l0 + 2, 14, 86));
  }
  add(h0, s0, l0);
};

const compareHexHueLightness = (a: string, b: string): number => {
  const A = rgbToHsl(hexToRgb(a)!);
  const B = rgbToHsl(hexToRgb(b)!);
  const dh = A.h - B.h;
  if (Math.abs(dh) > 0.01) return dh;
  return A.l - B.l;
};

const sortHexByHueLightness = (hexes: string[]): string[] => hexes.sort(compareHexHueLightness);

type PaletteSink = (h: number, s: number, l: number) => void;

const makePaletteSink = (): { acc: Set<string>; add: PaletteSink } => {
  const acc = new Set<string>();
  const add: PaletteSink = (h, s, l) => {
    acc.add(hslHex(h, s, l));
  };
  return { acc, add };
};

const buildColorPaletteFromHex = (baseHex: string): string[] => {
  const norm = normalizeBaseHex(baseHex);
  const rgb0 = hexToRgb(norm);
  if (!rgb0) return [FALLBACK_HEX];
  const { h: h0, s: s0, l: l0 } = rgbToHsl(rgb0);
  const { acc, add } = makePaletteSink();
  if (s0 < 1.5) {
    pushNeutralRamp(h0, add);
    return Array.from(acc);
  }
  pushChromaticRing(h0, s0, l0, add);
  return sortHexByHueLightness([...acc]);
};

const colorPaletteFromHex = (baseHex: string): string[] => buildColorPaletteFromHex(baseHex);

export { colorPaletteFromHex };
