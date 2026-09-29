import { getEffectiveThemeMode } from '../effectiveThemeModeAtom.js';

describe('getEffectiveThemeMode', () => {
  it('returns stored or controlled mode when customization is on', () => {
    expect(getEffectiveThemeMode(true, 'dark')).toBe('dark');
    expect(getEffectiveThemeMode(true, 'light', 'dark')).toBe('dark');
  });

  it('stays light when customization is off', () => {
    expect(getEffectiveThemeMode(false, 'dark', 'dark')).toBe('light');
  });
});
