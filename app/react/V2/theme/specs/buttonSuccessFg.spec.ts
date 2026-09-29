import {
  checkContrast,
  getAccessibleForegroundOnBackground,
  WCAG_AA_LARGE_UI,
} from '#shared/utils/contrast.js';
import { getButtonThemeContext } from '#V2/theme/buttonThemeContext.js';
import { getMainButtonThemeVars } from '#V2/theme/buttonMainThemeVars.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import { getThemeRoles } from '#V2/theme/themeRoles.js';
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

  it('uses resolved Legacy tokens for dark ghost and primary-on-solid', () => {
    const resolved = appliedTheme({ __preset: 'legacy' }, 'dark', true);
    const roles = getThemeRoles('legacy', resolved);
    const vars = {
      ...getScopedThemeVars('legacy', resolved),
      ...getMainButtonThemeVars(getButtonThemeContext('legacy', resolved, roles)),
    };
    expect(vars['--color-theme-button-ghost-bg']).toBe(resolved['--color-theme-bg-surface']);
    expect(vars['--color-theme-button-ghost-bg']).not.toBe('#FFFFFF');
    expect(vars['--color-theme-button-ghost-fg']).not.toBe('#374151');
    expect(vars['--color-theme-action-primary-fg']).not.toBe('#FFFFFF');
  });
});
