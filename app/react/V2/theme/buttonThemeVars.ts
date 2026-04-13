import type { ResolvedThemeVars, ThemePresetId } from '#V2/theme/themes.js';
import { getButtonThemeContext } from '#V2/theme/buttonThemeContext.js';
import {
  getEmbeddedButtonThemeVars,
  getToggleThemeVars,
} from '#V2/theme/buttonEmbeddedThemeVars.js';
import { getMainButtonThemeVars } from '#V2/theme/buttonMainThemeVars.js';
import { getStatusButtonThemeVars } from '#V2/theme/buttonStatusThemeVars.js';

const getButtonThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars
): Record<string, string> => {
  const context = getButtonThemeContext(presetId, resolved);
  return {
    ...getMainButtonThemeVars(context),
    ...getStatusButtonThemeVars(context),
    ...getEmbeddedButtonThemeVars(context),
    ...getToggleThemeVars(context),
  };
};

export { getButtonThemeVars };
