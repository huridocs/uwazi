import { getAccessibleColorPair, getContrastTextColor, mixHex } from '#shared/utils/contrast.js';
import {
  EMPHASIS_SOLID_BG,
  EMPHASIS_SOLID_FG,
  THEME_ACTIVE_BG,
  THEME_ACTIVE_FG,
  THEME_FOREGROUND_VAR,
  THEME_HOVER_BG,
  THEME_HOVER_FG,
  THEME_SEPARATOR_VAR,
  THEME_VAR,
} from '#V2/theme/roleTokens.js';
import type { ResolvedThemeVars } from '#V2/theme/themes.js';

const getDerivedThemeVars = (topbar: string): Record<string, string> => {
  const hoverBg = mixHex(topbar, '#000000', 0.12);
  const activeBg = mixHex(topbar, '#000000', 0.2);
  const fg = getContrastTextColor(topbar);

  return {
    [THEME_VAR]: topbar,
    [THEME_FOREGROUND_VAR]: fg,
    [THEME_SEPARATOR_VAR]: fg,
    [THEME_HOVER_BG]: hoverBg,
    [THEME_HOVER_FG]: getContrastTextColor(hoverBg),
    [THEME_ACTIVE_BG]: activeBg,
    [THEME_ACTIVE_FG]: getContrastTextColor(activeBg),
  };
};

const getActionThemeVars = (resolved: ResolvedThemeVars): Record<string, string> => {
  const emphasis = getAccessibleColorPair(resolved['--color-theme-accent-emphasis']);

  return {
    [EMPHASIS_SOLID_BG]: emphasis.background,
    [EMPHASIS_SOLID_FG]: emphasis.foreground,
  };
};

export { getActionThemeVars, getDerivedThemeVars };
