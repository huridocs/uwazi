const parseHex = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '');
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
};

const toHex = (value: number) => value.toString(16).padStart(2, '0');

/** Blends two hex colors. ratio 0 = base, 1 = blend. */
export const mixHexColor = (base: string, blend: string, ratio: number): string => {
  const clamped = Math.min(1, Math.max(0, ratio));
  const [r1, g1, b1] = parseHex(base);
  const [r2, g2, b2] = parseHex(blend);
  const r = Math.round(r1 + (r2 - r1) * clamped);
  const g = Math.round(g1 + (g2 - g1) * clamped);
  const b = Math.round(b1 + (b2 - b1) * clamped);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
