type Lab = { L: number; a: number; b: number };

const isValidHex = (s: string) => /^#([0-9a-fA-F]{6})$/.test(s);
const normalizeHex = (s: string) => (s.startsWith('#') ? s : `#${s}`).slice(0, 7);

const hexToRgbForSort = (hex: string): { r: number; g: number; b: number } | null => {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return {
    r: Math.trunc(n / 65536) % 256,
    g: Math.trunc((n % 65536) / 256),
    b: n % 256,
  };
};

const srgbChannelToLinear = (c: number): number => {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};

const labTransfer = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

const xyzFromLinearRgb = (r: number, g: number, b: number) => ({
  x: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
  y: r * 0.2126729 + g * 0.7151522 + b * 0.072175,
  z: r * 0.0193339 + g * 0.119192 + b * 0.9503041,
});

const labFromNormalizedChannels = (xn: number, yn: number, zn: number): Lab => {
  const fx = labTransfer(xn);
  const fy = labTransfer(yn);
  const fz = labTransfer(zn);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
};

const hexToLab = (hex: string): Lab | null => {
  const rgb = hexToRgbForSort(hex);
  if (!rgb) return null;
  const lr = srgbChannelToLinear(rgb.r);
  const lg = srgbChannelToLinear(rgb.g);
  const lb = srgbChannelToLinear(rgb.b);
  const xyz = xyzFromLinearRgb(lr, lg, lb);
  return labFromNormalizedChannels(xyz.x / 0.95047, xyz.y / 1, xyz.z / 1.08883);
};

const labDistanceSquared = (p: Lab, q: Lab): number => {
  const dL = p.L - q.L;
  const da = p.a - q.a;
  const db = p.b - q.b;
  return dL * dL + da * da + db * db;
};

const pickDarkestHex = (remaining: Set<string>, labs: Map<string, Lab>): string =>
  [...remaining].reduce((darkest, h) => (labs.get(h)!.L < labs.get(darkest)!.L ? h : darkest));

const pickNextLabNeighbor = (
  remaining: Set<string>,
  labs: Map<string, Lab>,
  current: string
): string => {
  let best = [...remaining][0];
  let bestD = Infinity;
  for (const h of remaining) {
    const d = labDistanceSquared(labs.get(current)!, labs.get(h)!);
    if (d < bestD || (d === bestD && h.localeCompare(best) < 0)) {
      bestD = d;
      best = h;
    }
  }
  return best;
};

const appendGreedyLabStep = (
  ordered: string[],
  remaining: Set<string>,
  labs: Map<string, Lab>,
  current: string
): string => {
  const best = pickNextLabNeighbor(remaining, labs, current);
  ordered.push(best);
  remaining.delete(best);
  return best;
};

const orderHexesByLabProximity = (labs: Map<string, Lab>): string[] => {
  const remaining = new Set([...labs.keys()]);
  const ordered: string[] = [];
  let current = pickDarkestHex(remaining, labs);
  ordered.push(current);
  remaining.delete(current);
  while (remaining.size > 0) {
    current = appendGreedyLabStep(ordered, remaining, labs, current);
  }
  return ordered;
};

const sortPaletteHexColors = (hexes: string[]): string[] => {
  const unique = Array.from(new Set(hexes.filter(isValidHex)));
  if (unique.length <= 1) return unique;
  const labs = new Map<string, Lab>();
  for (const h of unique) {
    const lab = hexToLab(h);
    if (lab) labs.set(h, lab);
  }
  return orderHexesByLabProximity(labs);
};

export { isValidHex, normalizeHex, sortPaletteHexColors };
