import { checkContrast } from '#shared/utils/contrast.js';
import { PRESET_DEFINITIONS, THEME_MODES, type ThemePresetId } from '#V2/theme/tokens.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import { parseThemeInstanceImportJson } from '#V2/theme/themeInstanceImport.js';
import cejilStagingTheme from '../instance-examples/cejil-staging.theme.json';
import chrTreatyImpactTheme from '../instance-examples/chr-treaty-impact.theme.json';
import eyeOnCubaTheme from '../instance-examples/eye-on-cuba.theme.json';
import tgeuTransMurderMonitoringTheme from '../instance-examples/tgeu-trans-murder-monitoring.theme.json';
import {
  appliedTheme,
  getChromeStyleOverrides,
  getPresetId,
  THEME_PRESET_KEY,
  type ThemeMode,
} from '#V2/theme/themes.js';

const PRESET_IDS: ThemePresetId[] = ['default', 'legacy', 'custom'];
const EXAMPLE_THEMES: { name: string; raw: unknown }[] = [
  { name: 'cejil-staging.theme.json', raw: cejilStagingTheme },
  { name: 'chr-treaty-impact.theme.json', raw: chrTreatyImpactTheme },
  { name: 'eye-on-cuba.theme.json', raw: eyeOnCubaTheme },
  { name: 'tgeu-trans-murder-monitoring.theme.json', raw: tgeuTransMurderMonitoringTheme },
];

const assertAaTextOnBg = (bg: string, fg: string) => {
  expect(checkContrast(bg, fg).passesAA).toBe(true);
};

const mergedScopedForVars = (themeVars: Record<string, string | undefined>, mode: ThemeMode) => {
  const resolved = appliedTheme(themeVars, mode, true);
  const presetId = getPresetId(themeVars, true);
  const scoped = getScopedThemeVars(presetId, resolved);
  return { ...scoped, ...getChromeStyleOverrides(themeVars, mode) };
};

describe('preset palettes accessibility (WCAG AA text)', () => {
  PRESET_IDS.forEach(presetId => {
    THEME_MODES.forEach(mode => {
      it(`${presetId} ${mode}: body, header, primary action`, () => {
        const resolved = PRESET_DEFINITIONS[presetId].modes[mode];
        const scoped = getScopedThemeVars(presetId, resolved);
        assertAaTextOnBg(
          resolved['--color-theme-bg-primary'],
          resolved['--color-theme-text-primary']
        );
        assertAaTextOnBg(
          scoped['--color-theme-chrome-app-bar'],
          scoped['--color-theme-chrome-app-bar-fg']
        );
        assertAaTextOnBg(
          scoped['--color-theme-action-primary'],
          scoped['--color-theme-action-primary-fg']
        );
      });
    });
  });
});

describe('instance example theme files accessibility', () => {
  it('has example files to check', () => {
    expect(EXAMPLE_THEMES.length).toBeGreaterThan(0);
  });

  EXAMPLE_THEMES.forEach(({ name, raw }) => {
    THEME_MODES.forEach(mode => {
      it(`${name} (${mode})`, () => {
        const parsed = parseThemeInstanceImportJson(raw);
        expect('flat' in parsed).toBe(true);
        if ('error' in parsed) throw new Error(parsed.error);
        const themeVars: Record<string, string> = {
          [THEME_PRESET_KEY]: 'custom',
          ...parsed.flat,
        };
        const merged = mergedScopedForVars(themeVars, mode);
        assertAaTextOnBg(merged['--color-theme-bg-primary'], merged['--color-theme-text-primary']);
        assertAaTextOnBg(
          merged['--color-theme-chrome-app-bar'],
          merged['--color-theme-chrome-app-bar-fg']
        );
        assertAaTextOnBg(
          merged['--color-theme-action-primary'],
          merged['--color-theme-action-primary-fg']
        );
      });
    });
  });
});
