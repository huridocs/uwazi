import { getAccessibleColorPair } from '#shared/utils/contrast.js';
import {
  EMPHASIS_LABEL,
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
import type { ThemeRoles } from '#V2/theme/themeRoles.js';

const getDerivedThemeVars = (chrome: ThemeRoles['chrome']): Record<string, string> => ({
  [THEME_VAR]: chrome.appBar,
  [THEME_FOREGROUND_VAR]: chrome.appBarFg,
  [THEME_SEPARATOR_VAR]: chrome.separator,
  [THEME_HOVER_BG]: chrome.appBarHover,
  [THEME_HOVER_FG]: chrome.appBarFg,
  [THEME_ACTIVE_BG]: chrome.appBarActive,
  [THEME_ACTIVE_FG]: chrome.appBarFg,
});

const getActionThemeVars = (roles: ThemeRoles): Record<string, string> => {
  const emphasis = getAccessibleColorPair(roles.feedback.danger);
  const sealLabel =
    'color-mix(in srgb, var(--color-theme-accent-emphasis) 55%, var(--color-theme-text-primary))';

  return {
    [EMPHASIS_SOLID_BG]: emphasis.background,
    [EMPHASIS_SOLID_FG]: emphasis.foreground,
    [EMPHASIS_LABEL]: sealLabel,
  };
};

export { getActionThemeVars, getDerivedThemeVars };
