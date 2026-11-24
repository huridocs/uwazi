import { fillChromeImportDefaults, headerCompanionsFromBar } from '../themeChromeOverrides.js';
import { settingsColorsFromRail } from '../relatedColorSuggestions.js';
import {
  parseThemeInstanceImportJson,
  themeVarsFromInstanceImport,
  simpleBaseFromFile,
} from '../themeInstanceImport.js';
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

  it('reads editor mode', () => {
    const result = parseThemeInstanceImportJson({
      editorMode: 'simple',
      light: { '--color-theme-accent-primary': '#112233' },
    });
    expect('flat' in result && result.editorMode).toBe('simple');
  });

  it('replaces the palette and keeps simple mode', () => {
    const next = themeVarsFromInstanceImport(
      {
        'light:--color-theme-accent-primary': '#112233',
        'light:--color-theme-text-secondary': '#ABCDEF',
      },
      'simple'
    );
    expect(next.__preset).toBe('custom');
    expect(next.__themeEditorMode).toBe('simple');
    expect(next['light:--color-theme-accent-primary']).toBe('#112233');
    expect(next['light:--color-theme-text-secondary']).not.toBe('#ABCDEF');
  });

  it('rederives a simple legacy file from the legacy preset', () => {
    const next = themeVarsFromInstanceImport(
      { 'light:--color-theme-accent-primary': '#112233' },
      'simple',
      'legacy'
    );
    expect(next['light:--color-theme-bg-primary']).toBe('#FFFFFF');
    expect(next.__themeSimpleBase).toBe('legacy');
  });
});

describe('themeVarsFromInstanceImport', () => {
  it('derives the settings active item from a rail-only file', () => {
    const result = parseThemeInstanceImportJson({
      chrome: { light: { '--color-theme-chrome-settings-rail-bg': '#000000' } },
    });
    const derived = settingsColorsFromRail({}, 'light', '#000000')[
      'light:--color-theme-chrome-settings-nav-item-active-bg'
    ];
    expect(
      'flat' in result && result.flat['light:--color-theme-chrome-settings-nav-item-active-bg']
    ).toBe(derived);
    const explicit = parseThemeInstanceImportJson({
      chrome: {
        light: {
          '--color-theme-chrome-settings-rail-bg': '#000000',
          '--color-theme-chrome-settings-nav-item-active-bg': '#ABCDEF',
        },
      },
    });
    expect(
      'flat' in explicit && explicit.flat['light:--color-theme-chrome-settings-nav-item-active-bg']
    ).toBe('#ABCDEF');
  });

  it('keeps file colors and fills a missing simple token', () => {
    const next = themeVarsFromInstanceImport(
      {
        'light:--color-theme-accent-primary': '#112233',
        'light:--color-theme-success': '#ABCDEF',
      },
      'simple'
    );
    expect(next['light:--color-theme-success']).toBe('#ABCDEF');
    expect(next['light:--color-theme-text-secondary']?.startsWith('#')).toBe(true);
  });

  it('treats a missing editor mode as simple', () => {
    const result = parseThemeInstanceImportJson({
      light: { '--color-theme-accent-primary': '#112233' },
    });
    expect('editorMode' in result && result.editorMode).toBe('simple');
  });

  it('stores the default derivation base when the file is not legacy', () => {
    const next = themeVarsFromInstanceImport(
      { 'light:--color-theme-accent-primary': '#112233' },
      'advanced',
      'default'
    );
    expect(next.__themeSimpleBase).toBe('default');
    expect(next.__themeEditorMode).toBe('advanced');
  });

  it('derives a custom file from the legacy logo preset', () => {
    const legacy = themeVarsFromInstanceImport(
      { 'light:--color-theme-accent-primary': '#112233' },
      'simple',
      'legacy'
    );
    const next = themeVarsFromInstanceImport(
      { 'light:--color-theme-accent-primary': '#112233' },
      'simple',
      simpleBaseFromFile('custom', 'legacy')
    );
    expect(simpleBaseFromFile('default', 'legacy')).toBe('default');
    expect(next.__themeSimpleBase).toBe('legacy');
    expect(next['light:--color-theme-text-secondary']).toBe(
      legacy['light:--color-theme-text-secondary']
    );
  });
});

describe('fillChromeImportDefaults', () => {
  it('derives the same separator as a header bar change', () => {
    const bar = '#242424';
    const filled = fillChromeImportDefaults({ '--color-theme-chrome-app-bar': bar });
    expect(filled['--color-theme-chrome-app-bar-separator']).toBe(
      headerCompanionsFromBar(bar)['--color-theme-chrome-app-bar-separator']
    );
  });
});
