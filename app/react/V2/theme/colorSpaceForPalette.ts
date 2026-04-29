const FALLBACK_HEX = '#C03B22';
const SIX_HEX = /^#([0-9a-fA-F]{6})$/;
const THREE_HEX = /^#([0-9a-fA-F]{3})$/i;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const clampByte = (n: number) => clamp(Math.round(n), 0, 255);

type Rgb = { r: number; g: number; b: number };

const normalizeBaseHex = (raw: string | undefined): string => {
  const s = (raw ?? '').trim();
  if (SIX_HEX.test(s)) return s.toUpperCase();
  const m3 = THREE_HEX.exec(s);
  if (m3) {
    const c = m3[1];
    return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`.toUpperCase();
  }
  return FALLBACK_HEX;
};

const hexToRgb = (hex: string): Rgb | null => {
  if (!SIX_HEX.test(hex)) return null;
  const n = parseInt(hex.slice(1), 16);
  return {
    r: Math.trunc(n / 65536) % 256,
    g: Math.trunc((n % 65536) / 256),
    b: n % 256,
  };
};

const rgbToHex = ({ r, g, b }: Rgb): string =>
  `#${[r, g, b].map(c => clampByte(c).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

type HueFromRgbUnitInput = { rn: number; gn: number; bn: number; max: number; d: number };

const hueFromRgbUnit = ({ rn, gn, bn, max, d }: HueFromRgbUnitInput): number => {
  if (max === rn) return ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  if (max === gn) return ((bn - rn) / d + 2) / 6;
  return ((rn - gn) / d + 4) / 6;
};

const rgbToHsl = ({ r, g, b }: Rgb): { h: number; s: number; l: number } => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;
  if (d < 1e-9) return { h: 0, s: 0, l: l * 100 };
  const sat = l > 0.5 ? d / (2 - max - min) : d / (max - min);
  return {
    h: hueFromRgbUnit({ rn, gn, bn, max, d }) * 360,
    s: sat * 100,
    l: l * 100,
  };
};

const hslSectorRgb = (h: number, c: number, x: number, m: number): Rgb => {
  const seg = Math.min(5, Math.floor(h / 60));
  const tri: readonly [number, number, number][] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [rp, gp, bp] = tri[seg];
  return {
    r: clampByte((rp + m) * 255),
    g: clampByte((gp + m) * 255),
    b: clampByte((bp + m) * 255),
  };
};

const hslToRgb = (hDeg: number, sPct: number, lPct: number): Rgb => {
  const h = ((hDeg % 360) + 360) % 360;
  const s = clamp(sPct, 0, 100) / 100;
  const l = clamp(lPct, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  return hslSectorRgb(h, c, x, m);
};

const hslHex = (h: number, s: number, l: number) => rgbToHex(hslToRgb(h, s, l));

export type { Rgb };
export { FALLBACK_HEX, clamp, hexToRgb, hslHex, hslToRgb, normalizeBaseHex, rgbToHex, rgbToHsl };
