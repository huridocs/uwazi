import { checkContrast } from '#shared/utils/contrast.js';
import { PRESET_DEFINITIONS, THEME_MODES, type ThemePresetId } from '#V2/theme/tokens.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';

const PRESET_IDS: ThemePresetId[] = ['default', 'legacy', 'custom'];

const assertAaTextOnBg = (bg: string, fg: string) => {
  expect(checkContrast(bg, fg).passesAA).toBe(true);
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
