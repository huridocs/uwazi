import { appliedTheme } from '#V2/theme/themes.js';
import { PRESET_DEFINITIONS } from '#V2/theme/tokens.js';

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
});
