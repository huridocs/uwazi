import { getTextColor } from '../helpers/getTextColor';

describe('getTextColor', () => {
  it('should return black for empty/falsy input', () => {
    expect(getTextColor('')).toBe('#000');
  });

  it('should return white for dark backgrounds', () => {
    expect(getTextColor('#000000')).toBe('#FFF');
    expect(getTextColor('#1a1a1a')).toBe('#FFF');
    expect(getTextColor('#333333')).toBe('#FFF');
  });

  it('should return a dark color for light backgounds', () => {
    expect(getTextColor('#ffff00')).toBe('#666600');
    expect(getTextColor('#ffffff')).toBe('#4d4d4d');
  });

  it('should handle 3-character hex codes', () => {
    expect(getTextColor('#000')).toBe('#FFF');
    expect(getTextColor('#fff')).toBe('#4d4d4d');
  });

  it('should handle hex without leading #', () => {
    expect(getTextColor('000000')).toBe('#FFF');
  });
});
