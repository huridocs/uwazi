import { getButtonThemeVars } from '#V2/theme/buttonThemeVars.js';
import {
  getBannerThemeVars,
  getCardThemeVars,
  getControlThemeVars,
  getSurfaceThemeVars,
} from '#V2/theme/surfaceThemeVars.js';
import { getActionThemeVars, getDerivedThemeVars } from '#V2/theme/themeBaseVars.js';
import {
  ACCENT_PRIMARY_KEY,
  getPresetId,
  type ResolvedThemeVars,
  toCompatibilityVars,
} from '#V2/theme/themes.js';

const getScopedThemeVars = (
  presetId: ReturnType<typeof getPresetId>,
  resolved: ResolvedThemeVars
): Record<string, string> => {
  const topbar = resolved[ACCENT_PRIMARY_KEY] ?? '#1A1A1A';

  return {
    ...resolved,
    ...toCompatibilityVars(resolved),
    ...getDerivedThemeVars(topbar),
    ...getActionThemeVars(resolved),
    ...getButtonThemeVars(presetId, resolved),
    ...getControlThemeVars(presetId, resolved),
    ...getSurfaceThemeVars(presetId, resolved),
    ...getCardThemeVars(presetId, resolved),
    ...getBannerThemeVars(presetId, resolved),
  };
};

export { getScopedThemeVars };
