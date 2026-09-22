import { getLayoutThemeVars } from '../layoutThemeVars.js';
import { UWAZI_DESIGN_DARK, UWAZI_DESIGN_LIGHT } from '../uwaziDesignTokens.js';

describe('Uwazi Design tokens vs prototype tokens.css', () => {
  it('locks radii to the live prototype scale', () => {
    expect(UWAZI_DESIGN_LIGHT.radiusLg).toBe('12px');
    expect(UWAZI_DESIGN_LIGHT.radiusXl).toBe('16px');
    expect(UWAZI_DESIGN_DARK.radiusLg).toBe(UWAZI_DESIGN_LIGHT.radiusLg);
    expect(UWAZI_DESIGN_DARK.radiusXl).toBe(UWAZI_DESIGN_LIGHT.radiusXl);
    expect(getLayoutThemeVars('default')['--radius-lg']).toBe('12px');
    expect(getLayoutThemeVars('default')['--radius-xl']).toBe('16px');
    expect(getLayoutThemeVars('legacy')).toEqual({});
  });

  it('locks theme-invariant seal fill', () => {
    expect(UWAZI_DESIGN_LIGHT.accentSealFill).toBe('#D53E27');
    expect(UWAZI_DESIGN_DARK.accentSealFill).toBe('#D53E27');
  });
});
