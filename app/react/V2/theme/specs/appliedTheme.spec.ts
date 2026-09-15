import { appliedTheme, getCustomThemeVars } from '#V2/theme/themes.js';
import { PRESET_DEFINITIONS } from '#V2/theme/tokens.js';
import { checkContrast, WCAG_AA_LARGE_UI } from '#shared/utils/contrast.js';

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
    expect(
      checkContrast('#FFFFFF', resolved['--color-theme-feedback-danger-fg']).ratio
    ).toBeGreaterThan(WCAG_AA_LARGE_UI);
    expect(
      checkContrast('#FFFFFF', resolved['--color-theme-feedback-success-fg']).ratio
    ).toBeGreaterThan(WCAG_AA_LARGE_UI);
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

  it('locks Uwazi Design light borders and 64% variants to tokens.css', () => {
    const { light } = PRESET_DEFINITIONS.default.modes;
    expect(light['--color-theme-border-primary']).toBe('#EDE7DB');
    expect(light['--color-theme-border-soft']).toBe('#E2DBC9');
    expect(light['--color-theme-border-primary-64']).toBe('#EDE7DBA3');
    expect(light['--color-theme-border-soft-64']).toBe('#E2DBC9A3');
  });

  it('locks Uwazi Design dark tertiary, muted, and borders to tokens.css', () => {
    const { dark } = PRESET_DEFINITIONS.default.modes;
    expect(dark['--color-theme-text-tertiary']).toBe('#ADA79E');
    expect(dark['--color-theme-text-muted']).toBe('#8A857C');
    expect(dark['--color-theme-border-primary']).toBe('#514E48');
    expect(dark['--color-theme-border-soft']).toBe('#5E5A53');
    expect(dark['--color-theme-border-primary-64']).toBe('#514E48A3');
    expect(dark['--color-theme-border-soft-64']).toBe('#5E5A53A3');
  });

  it('keeps Legacy light derived on current-app pairs without Design leftovers', () => {
    const { light } = PRESET_DEFINITIONS.legacy.modes;
    expect(light['--color-theme-bg-warm']).toBe('#F9FAFB');
    expect(light['--color-theme-bg-selected']).toBe('#F2F2F4');
    expect(light['--color-theme-danger']).toBe('#D9534F');
    expect(light['--color-theme-bg-warm']).not.toBe('#FCFAF8');
    expect(light['--color-theme-danger']).not.toBe('#E8432A');
    expect(Object.values(light)).not.toContain('#F5F0E8');
  });

  it('keeps Legacy dark derived on current-app pairs without Design leftovers', () => {
    const { dark } = PRESET_DEFINITIONS.legacy.modes;
    expect(dark['--color-theme-bg-warm']).toBe('#243041');
    expect(dark['--color-theme-bg-selected']).toBe('#243041');
    expect(dark['--color-theme-bg-warm']).not.toBe('#2A2A2A');
    expect(dark['--color-theme-text-tertiary']).not.toBe('#ADA79E');
    expect(Object.values(dark)).not.toContain('#F5F0E8');
  });
});
