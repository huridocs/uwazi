import { appliedTheme, getCustomThemeVars } from '#V2/theme/themes.js';
import { PRESET_DEFINITIONS } from '#V2/theme/tokens.js';
import { checkContrast } from '#shared/utils/contrast.js';

describe('appliedTheme', () => {
  it('uses legacy preset and ignores stored vars when customization pipeline is off', () => {
    const varsWithOverrides = {
      __preset: 'default' as const,
      'light:--color-theme-accent-primary': '#ff0000',
    };
    expect(appliedTheme(varsWithOverrides, 'light', false)).toEqual(
      PRESET_DEFINITIONS.legacy.modes.light
    );
  });

  it('matches packaged legacy light tokens when theme vars are absent and pipeline is off', () => {
    expect(appliedTheme(undefined, 'light', false)).toEqual(PRESET_DEFINITIONS.legacy.modes.light);
  });

  it('keeps resolved preset tokens unchanged when source colors are not customized', () => {
    expect(appliedTheme({ __preset: 'default' }, 'light', true)).toEqual(
      PRESET_DEFINITIONS.default.modes.light
    );
    expect(appliedTheme({ __preset: 'legacy' }, 'dark', true)).toEqual(
      PRESET_DEFINITIONS.legacy.modes.dark
    );
    expect(appliedTheme(getCustomThemeVars(undefined, true), 'light', true)).toEqual(
      PRESET_DEFINITIONS.custom.modes.light
    );
  });

  it('derives feedback foregrounds and danger tokens from source background colors', () => {
    const resolved = appliedTheme(
      {
        'light:--color-theme-accent-emphasis': '#FFFFFF',
        'light:--color-theme-success': '#FFFFFF',
      },
      'light',
      true
    );

    expect(resolved['--color-theme-danger']).toBe('#FFFFFF');
    expect(checkContrast('#FFFFFF', resolved['--color-theme-feedback-danger-fg']).passesAA).toBe(
      true
    );
    expect(checkContrast('#FFFFFF', resolved['--color-theme-feedback-success-fg']).passesAA).toBe(
      true
    );
  });

  it('stores source color overrides without derived color rows', () => {
    const customVars = getCustomThemeVars(
      {
        'light:--color-theme-accent-emphasis': '#FFFFFF',
        'light:--color-theme-feedback-danger-fg': '#FFFFFF',
      },
      true
    );

    expect(customVars['light:--color-theme-accent-emphasis']).toBe('#FFFFFF');
    expect(customVars['light:--color-theme-feedback-danger-fg']).toBeUndefined();
  });
});
