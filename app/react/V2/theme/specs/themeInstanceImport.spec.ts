import { parseThemeInstanceImportJson } from '../themeInstanceImport.js';
import { stripChromeStorageKeysAbsentFromImport, THEME_PRESET_KEY } from '../themes.js';

describe('parseThemeInstanceImportJson', () => {
  it('accepts light-only semantic map', () => {
    const result = parseThemeInstanceImportJson({
      id: 'test',
      light: { '--color-theme-accent-primary': '#2B56C1' },
    });
    expect('flat' in result).toBe(true);
    if ('flat' in result) {
      expect(result.flat['light:--color-theme-accent-primary']).toBe('#2B56C1');
    }
  });

  it('rejects invalid hex', () => {
    const result = parseThemeInstanceImportJson({
      light: { '--color-theme-accent-primary': '#gg0000' },
    });
    expect('error' in result).toBe(true);
  });

  it('rejects unknown semantic key', () => {
    const result = parseThemeInstanceImportJson({
      light: { '--color-theme-unknown': '#2B56C1' },
    });
    expect('error' in result).toBe(true);
  });

  it('rejects empty modes', () => {
    const result = parseThemeInstanceImportJson({ id: 'x' });
    expect('error' in result).toBe(true);
  });

  it('rejects empty light and dark objects', () => {
    const result = parseThemeInstanceImportJson({ light: {}, dark: {} });
    expect('error' in result).toBe(true);
  });

  it('stripChromeStorageKeysAbsentFromImport removes chrome not in import', () => {
    const base = {
      [THEME_PRESET_KEY]: 'custom',
      'light:--color-theme-chrome-app-bar': '#00FF00',
      'light:--color-theme-accent-primary': '#111111',
    };
    const importedFlat = { 'light:--color-theme-accent-primary': '#222222' };
    const stripped = stripChromeStorageKeysAbsentFromImport(base, importedFlat);
    expect(stripped['light:--color-theme-chrome-app-bar']).toBeUndefined();
    expect(stripped['light:--color-theme-accent-primary']).toBe('#111111');
  });

  it('accepts chrome-only import and derives header foreground', () => {
    const result = parseThemeInstanceImportJson({
      chrome: { light: { '--color-theme-chrome-app-bar': '#222222' } },
    });
    expect('flat' in result).toBe(true);
    if ('flat' in result) {
      expect(result.flat['light:--color-theme-chrome-app-bar']).toBe('#222222');
      expect(result.flat['light:--color-theme-chrome-app-bar-fg']?.startsWith('#')).toBe(true);
    }
  });
});
