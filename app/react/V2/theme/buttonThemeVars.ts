import type { ResolvedThemeVars, ThemePresetId } from '#V2/theme/themes.js';
import { getButtonThemeContext } from '#V2/theme/buttonThemeContext.js';
import {
  getEmbeddedButtonThemeVars,
  getToggleThemeVars,
} from '#V2/theme/buttonEmbeddedThemeVars.js';
import { getMainButtonThemeVars } from '#V2/theme/buttonMainThemeVars.js';
import { getStatusButtonThemeVars } from '#V2/theme/buttonStatusThemeVars.js';
import { getThemeRoles, type ThemeRoles } from '#V2/theme/themeRoles.js';

const getButtonThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars,
  roles: ThemeRoles = getThemeRoles(presetId, resolved)
): Record<string, string> => {
  const context = getButtonThemeContext(presetId, resolved, roles);
  return {
    ...getMainButtonThemeVars(context),
    ...getStatusButtonThemeVars(context),
    ...getEmbeddedButtonThemeVars(context, roles),
    ...getToggleThemeVars(context, roles),
  };
};

export { getButtonThemeVars };
