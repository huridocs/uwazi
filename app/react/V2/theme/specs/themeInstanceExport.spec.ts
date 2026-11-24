import { headerCompanionsFromBar } from '../themeChromeOverrides.js';
import { appliedTheme, mergeScopedThemeAndChrome } from '../themes.js';
import {
  parseThemeInstanceImportText,
  themeVarsFromInstanceImport,
} from '../themeInstanceImport.js';
import { buildThemeInstanceExport, themeExportValue } from '../themeInstanceExport.js';
import { selectThemePreset } from '../themePresetBackup.js';
import { assessHeaderSample, HEADER_COLOR_SAMPLES } from '../headerColorCoverage.js';

describe('buildThemeInstanceExport', () => {
  const headerSample = () =>
    buildThemeInstanceExport({
      'light:--color-theme-chrome-app-bar': '#FFFFFF',
      'light:--color-theme-chrome-app-bar-fg': '#0C9AD6',
    });

  it('writes a note on each full-mode token', () => {
    const file = headerSample();
    expect(file).toContain('"header": {');
    expect(file).toContain('"--color-theme-chrome-app-bar": "#FFFFFF", # Header bar');
    expect(file).toContain(
      '"--color-theme-chrome-app-bar-fg": "#0C9AD6", # Header title, language, library and settings'
    );
    expect(file).toContain('# Resting fill of language, library and settings');
    expect(file).toContain('"page": {');
    expect(file).toContain('# Cards and panels');
    expect(file).toContain('"settings": {');
    expect(file).not.toContain('affects');
  });

  it('reimports the commented file', () => {
    const parsed = parseThemeInstanceImportText(headerSample());
    expect('flat' in parsed).toBe(true);
    if ('flat' in parsed) {
      expect(parsed.flat['light:--color-theme-chrome-app-bar']).toBe('#FFFFFF');
      expect(parsed.flat['light:--color-theme-chrome-app-bar-fg']).toBe('#0C9AD6');
    }
  });

  it('fills header text when only the bar is stored', () => {
    const file = buildThemeInstanceExport({
      'light:--color-theme-chrome-app-bar': '#EA5050',
    });
    expect(file).toContain('# Header title, language, library and settings');
  });

  it('exports the parked custom colors instead of the named preset', () => {
    const file = buildThemeInstanceExport({
      __preset: 'default',
      'backup:__preset': 'custom',
      'backup:light:--color-theme-accent-primary': '#112233',
    });
    expect(file).toContain('"id": "custom"');
    expect(file).toContain('#112233');
  });

  it('exports an edit made while the custom colors are parked', () => {
    const parked = selectThemePreset(
      {
        __preset: 'custom',
        'light:--color-theme-accent-primary': '#112233',
        'light:--color-theme-chrome-app-bar': '#FFFFFF',
      },
      'default'
    );
    const file = buildThemeInstanceExport({
      ...parked,
      'light:--color-theme-chrome-app-bar': '#EA5050',
    });
    expect(file).toContain('#112233');
    expect(file).toContain('#EA5050');
  });

  it('writes a legacy id when custom colors sit on the legacy asset preset', () => {
    const file = buildThemeInstanceExport(
      { __preset: 'custom', __themeEditorMode: 'simple' },
      'legacy'
    );
    expect(file).toContain('"id": "legacy"');
    const parsed = parseThemeInstanceImportText(file);
    expect('presetId' in parsed && parsed.presetId).toBe('legacy');
  });

  it('keeps a stored derivation base when the logo preset is not passed', () => {
    const imported = themeVarsFromInstanceImport(
      { 'light:--color-theme-accent-primary': '#112233' },
      'simple',
      'legacy'
    );
    const parked = selectThemePreset(imported, 'default');
    const file = buildThemeInstanceExport(parked);
    expect(file).toContain('"id": "legacy"');
    expect(imported.__themeSimpleBase).toBe('legacy');
  });

  it('writes a stored default base and treats a missing editor mode as simple', () => {
    const file = buildThemeInstanceExport({
      __preset: 'custom',
      __themeSimpleBase: 'default',
    });
    expect(file).toContain('"id": "default"');
    expect(file).toContain('"editorMode": "simple"');
  });

  it('records simple editor mode and skips a missing color', () => {
    const file = buildThemeInstanceExport({ __themeEditorMode: 'simple' });
    expect(file).toContain('"editorMode": "simple"');
    expect(
      themeExportValue({ '--color-theme-bg-primary': '#F5F0E8' }, '--color-theme-bg-muted')
    ).toBe(undefined);
  });
});

describe('theme instance id', () => {
  it('keeps the color preset when the logos belong to the other preset', () => {
    expect(buildThemeInstanceExport({ __preset: 'legacy' }, 'default')).toContain('"id": "legacy"');
    expect(buildThemeInstanceExport({ __preset: 'custom' }, 'default')).toContain('"id": "custom"');
  });

  it('records a legacy logo preset next to a default color base', () => {
    const file = buildThemeInstanceExport(
      { __preset: 'custom', __themeSimpleBase: 'default' },
      'legacy'
    );
    expect(file).toContain('"id": "default"');
    expect(file).toContain('"assetPreset": "legacy"');
    const parsed = parseThemeInstanceImportText(file);
    expect('assetPreset' in parsed && parsed.assetPreset).toBe('legacy');
  });
});

describe('mergeScopedThemeAndChrome', () => {
  it('fills missing header colors from the stored bar', () => {
    const bar = '#242424';
    const derived = headerCompanionsFromBar(bar);
    const merged = mergeScopedThemeAndChrome(
      {
        '--color-theme-chrome-app-bar': '#FFFFFF',
        '--color-theme-chrome-app-bar-hover': '#FCFAF8',
        '--color-theme-chrome-app-bar-active': '#F5EED7',
      },
      { '--color-theme-chrome-app-bar': bar, '--color-theme-chrome-app-bar-fg': '#ABCDEF' },
      appliedTheme({}, 'light', true)
    );
    expect(merged['--color-theme-chrome-app-bar-fg']).toBe('#ABCDEF');
    expect(merged['--color-theme-chrome-app-bar-fg-hover']).toBe(
      derived['--color-theme-chrome-app-bar-fg-hover']
    );
    expect(merged['--color-theme-chrome-app-bar-hover']).toBe(
      derived['--color-theme-chrome-app-bar-hover']
    );
    expect(merged['--color-theme-chrome-app-bar-active']).toBe(
      derived['--color-theme-chrome-app-bar-active']
    );
    expect(merged['--color-theme-chrome-app-bar-separator']).toBe(
      derived['--color-theme-chrome-app-bar-separator']
    );
  });
});

describe('header color samples', () => {
  const bySite = Object.fromEntries(
    HEADER_COLOR_SAMPLES.map(assessHeaderSample).map(row => [row.site, row])
  );

  it('covers solid bar and text', () => {
    expect(bySite['sos-defenders.org'].covered).toEqual(['header-bar', 'header-text']);
    expect(bySite['sos-defenders.org'].gaps).toEqual([]);
    expect(bySite['electionjudgments.org'].covered).toContain('header-text');
    expect(bySite['nkpd.io'].gaps).toEqual([]);
    const covered = Object.values(bySite).filter(row => row.gaps.length === 0);
    expect(covered.length).toBeGreaterThanOrEqual(8);
  });

  it('records header gaps colors cannot close', () => {
    expect(bySite['endreprisals.ishr.ch'].gaps).toContain('hover-separate-hue');
    expect(bySite['caselaw.ihrda.org'].gaps).toContain('menu-button-fill');
    expect(bySite['caselaw.ihrda.org'].gaps).toContain('header-height');
    expect(bySite['ramo.youthinitiativef.org'].gaps).toContain('header-gradient');
    expect(bySite['summa.cejil.org'].gaps).toContain('header-background-image');
    expect(bySite['justiceforwagetheft.org'].gaps).toContain('header-height');
  });
});
