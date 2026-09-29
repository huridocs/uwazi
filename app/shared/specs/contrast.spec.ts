import {
  checkContrast,
  getRelativeLuminanceFromHex,
  getTemplatePillColors,
  parseColorToHex,
} from '#shared/utils/contrast.js';

describe('getTemplatePillColors', () => {
  it('keeps a light tint and mixes accent toward ink in light theme', () => {
    const { background, foreground, ratio } = getTemplatePillColors(
      '#2B56C1',
      '#F5F0E8',
      '#1A1A1A'
    );
    expect(getRelativeLuminanceFromHex(background)).toBeGreaterThan(0.7);
    expect(foreground).not.toBe('#2B56C1');
    expect(checkContrast(background, foreground).passesAA).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('does not invert pastel accents into a dark chip on a light tint', () => {
    const { background, foreground, ratio } = getTemplatePillColors(
      '#AC94FA',
      '#F5F0E8',
      '#1A1A1A'
    );
    expect(getRelativeLuminanceFromHex(background)).toBeGreaterThan(0.7);
    expect(checkContrast(background, foreground).passesAA).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps a dark tint in dark theme', () => {
    const { background, foreground, ratio } = getTemplatePillColors(
      '#AC94FA',
      '#2A2A2A',
      '#F5F0E8'
    );
    expect(getRelativeLuminanceFromHex(background)).toBeLessThan(0.3);
    expect(checkContrast(background, foreground).passesAA).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

describe('getRelativeLuminanceFromHex', () => {
  it('returns relative luminance for a hex color', () => {
    expect(getRelativeLuminanceFromHex('#000000')).toBe(0);
    expect(getRelativeLuminanceFromHex('#FFFFFF')).toBe(1);
  });
});

describe('parseColorToHex', () => {
  it('normalizes short and bare hex colors', () => {
    expect(parseColorToHex('#fff')).toBe('#ffffff');
    expect(parseColorToHex('fff')).toBe('#ffffff');
    expect(parseColorToHex('000000')).toBe('#000000');
  });

  it('returns null for empty or invalid colors', () => {
    expect(parseColorToHex('')).toBeNull();
    expect(parseColorToHex('not-a-color')).toBeNull();
  });
});
