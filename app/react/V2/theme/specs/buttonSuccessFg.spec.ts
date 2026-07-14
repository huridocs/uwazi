import {
  checkContrast,
  getAccessibleForegroundOnBackground,
  WCAG_AA_LARGE_UI,
} from '#shared/utils/contrast.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import { appliedTheme, getPresetId } from '#V2/theme/themes.js';

describe('solid success button foreground', () => {
  it('keeps white text on uwazi success green for UI controls', () => {
    expect(checkContrast('#059669', '#FFFFFF').ratio).toBeGreaterThan(WCAG_AA_LARGE_UI);
    expect(
      getAccessibleForegroundOnBackground(
        '#059669',
        '#FFFFFF',
        WCAG_AA_LARGE_UI
      ).foreground.toLowerCase()
    ).toBe('#ffffff');
  });

  it('exposes white button success fg in scoped theme vars', () => {
    const resolved = appliedTheme(undefined, 'light', false);
    const vars = getScopedThemeVars(getPresetId(undefined, false), resolved);
    expect(vars['--color-theme-feedback-success-fg']?.toLowerCase()).toBe('#ffffff');
    expect(vars['--color-theme-button-success-fg']?.toLowerCase()).toBe('#ffffff');
  });
});
