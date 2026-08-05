import type { ThemePresetId } from '#V2/theme/themes.js';
import { UWAZI_DESIGN_LIGHT } from '#V2/theme/uwaziDesignTokens.js';

const getLayoutThemeVars = (presetId: ThemePresetId): Record<string, string> =>
  presetId === 'legacy'
    ? {}
    : {
        '--radius-sm': UWAZI_DESIGN_LIGHT.radiusSm,
        '--radius-md': UWAZI_DESIGN_LIGHT.radiusMd,
        '--radius-lg': UWAZI_DESIGN_LIGHT.radiusLg,
        '--radius-xl': UWAZI_DESIGN_LIGHT.radiusXl,
      };

export { getLayoutThemeVars };
