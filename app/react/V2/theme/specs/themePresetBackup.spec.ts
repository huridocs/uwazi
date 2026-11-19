import { selectThemePreset } from '../themePresetBackup.js';

describe('selectThemePreset', () => {
  const custom = {
    __preset: 'custom',
    __themeEditorMode: 'advanced',
    'light:--color-theme-accent-primary': '#112233',
    'light:--color-theme-chrome-app-bar': '#FFFFFF',
  };

  it('keeps the custom pair when switching to Uwazi design', () => {
    const next = selectThemePreset(custom, 'default');
    expect(next.__preset).toBe('default');
    expect(next['light:--color-theme-accent-primary']).toBeUndefined();
    expect(next['backup:light:--color-theme-accent-primary']).toBe('#112233');
    expect(next['backup:light:--color-theme-chrome-app-bar']).toBe('#FFFFFF');
    expect(next['backup:__themeEditorMode']).toBe('advanced');
  });

  it('restores the backup when switching back to custom', () => {
    const parked = selectThemePreset(custom, 'default');
    const restored = selectThemePreset(parked, 'custom');
    expect(restored.__preset).toBe('custom');
    expect(restored['light:--color-theme-accent-primary']).toBe('#112233');
    expect(restored['light:--color-theme-chrome-app-bar']).toBe('#FFFFFF');
    expect(restored.__themeEditorMode).toBe('advanced');
    expect(restored['backup:light:--color-theme-accent-primary']).toBeUndefined();
  });

  it('keeps the backup while moving between named presets', () => {
    const parked = selectThemePreset(custom, 'default');
    const legacy = selectThemePreset(parked, 'legacy');
    expect(legacy.__preset).toBe('legacy');
    expect(legacy['backup:light:--color-theme-accent-primary']).toBe('#112233');
  });

  it('starts a fresh custom pair without copying the named preset', () => {
    const next = selectThemePreset({ __preset: 'default' }, 'custom');
    expect(next).toEqual({ __preset: 'custom' });
  });

  it('keeps an edit made on the named preset when custom is restored', () => {
    const parked = selectThemePreset(custom, 'default');
    const edited = { ...parked, 'light:--color-theme-chrome-app-bar': '#EA5050' };
    const restored = selectThemePreset(edited, 'custom');
    expect(restored['light:--color-theme-chrome-app-bar']).toBe('#EA5050');
    expect(restored['light:--color-theme-accent-primary']).toBe('#112233');
    expect(restored['backup:light:--color-theme-accent-primary']).toBeUndefined();
  });
});
