import {
  checkContrast,
  getRelativeLuminanceFromHex,
  getTemplatePillColors,
  parseColorToHex,
} from '#shared/utils/contrast.js';

describe('getTemplatePillColors', () => {
  it('uses accent as foreground when a light tint meets AA', () => {
    const { background, foreground, ratio } = getTemplatePillColors('#2B56C1', '#F5F0E8');
    expect(foreground).toBe('#2B56C1');
    expect(checkContrast(background, foreground).passesAA).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('adjusts foreground when accent on tint cannot reach AA', () => {
    const { background, foreground, ratio } = getTemplatePillColors('#9eb0fd', '#F5F0E8');
    expect(foreground).not.toBe('#9eb0fd');
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
