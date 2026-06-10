import { getButtonThemeVars } from '#V2/theme/buttonThemeVars.js';
import {
  getBannerThemeVars,
  getCardThemeVars,
  getControlThemeVars,
  getSurfaceThemeVars,
} from '#V2/theme/surfaceThemeVars.js';
import { getActionThemeVars, getDerivedThemeVars } from '#V2/theme/themeBaseVars.js';
import { getThemeRoles, getThemeRoleVars } from '#V2/theme/themeRoles.js';
import { getPresetId, type ResolvedThemeVars, toCompatibilityVars } from '#V2/theme/themes.js';
import { getTypographyThemeVars } from './typographyThemeVars.js';

const getScopedThemeVars = (
  presetId: ReturnType<typeof getPresetId>,
  resolved: ResolvedThemeVars
): Record<string, string> => {
  const roles = getThemeRoles(presetId, resolved);

  return {
    ...resolved,
    ...getThemeRoleVars(roles),
    ...toCompatibilityVars(resolved),
    ...getDerivedThemeVars(roles.chrome),
    ...getActionThemeVars(roles),
    ...getButtonThemeVars(presetId, resolved, roles),
    ...getControlThemeVars(presetId, resolved, roles),
    ...getSurfaceThemeVars(presetId, resolved, roles),
    ...getCardThemeVars(presetId, resolved, roles),
    ...getBannerThemeVars(presetId, resolved, roles),
    ...getTypographyThemeVars(),
  };
};

export { getScopedThemeVars };
