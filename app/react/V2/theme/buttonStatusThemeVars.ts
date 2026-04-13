import type { ButtonThemeContext } from '#V2/theme/buttonThemeContext.js';
import { LEGACY_BUTTON_VALUES } from '#V2/theme/buttonThemeContext.js';
import {
  BUTTON_DANGER_BG,
  BUTTON_DANGER_BORDER,
  BUTTON_DANGER_FG,
  BUTTON_DANGER_SECONDARY_BG,
  BUTTON_DANGER_SECONDARY_BORDER,
  BUTTON_DANGER_SECONDARY_FG,
  BUTTON_DANGER_SUBTLE_BG,
  BUTTON_DANGER_SUBTLE_BORDER,
  BUTTON_DANGER_SUBTLE_FG,
  BUTTON_SUCCESS_BG,
  BUTTON_SUCCESS_BORDER,
  BUTTON_SUCCESS_DISABLED_BG,
  BUTTON_SUCCESS_DISABLED_BORDER,
  BUTTON_SUCCESS_DISABLED_FG,
  BUTTON_SUCCESS_FG,
  BUTTON_SUCCESS_HOVER_BG,
  BUTTON_SUCCESS_SECONDARY_BG,
  BUTTON_SUCCESS_SECONDARY_BORDER,
  BUTTON_SUCCESS_SECONDARY_FG,
  BUTTON_SUCCESS_SUBTLE_BG,
  BUTTON_SUCCESS_SUBTLE_BORDER,
  BUTTON_SUCCESS_SUBTLE_FG,
} from '#V2/theme/roleTokens.js';

const getStatusButtonThemeVars = (context: ButtonThemeContext): Record<string, string> => ({
  [BUTTON_DANGER_BORDER]: context.dangerSolid.background,
  [BUTTON_DANGER_BG]: context.dangerSolid.background,
  [BUTTON_DANGER_FG]: context.dangerSolid.foreground,
  [BUTTON_SUCCESS_BORDER]: context.successSolidBackground,
  [BUTTON_SUCCESS_BG]: context.successSolidBackground,
  [BUTTON_SUCCESS_FG]: context.successSolidForeground,
  [BUTTON_SUCCESS_HOVER_BG]: context.successHoverBackground,
  [BUTTON_SUCCESS_DISABLED_BORDER]: context.successDisabledBackground,
  [BUTTON_SUCCESS_DISABLED_BG]: context.successDisabledBackground,
  [BUTTON_SUCCESS_DISABLED_FG]: context.successDisabledForeground,
  [BUTTON_DANGER_SECONDARY_BORDER]: context.dangerBorderOnSurface,
  [BUTTON_DANGER_SECONDARY_BG]: context.dangerSecondaryBackground,
  [BUTTON_DANGER_SECONDARY_FG]: context.dangerOnSecondaryBackground,
  [BUTTON_SUCCESS_SECONDARY_BORDER]: context.successBorderOnSurface,
  [BUTTON_SUCCESS_SECONDARY_BG]: context.successSecondaryBackground,
  [BUTTON_SUCCESS_SECONDARY_FG]: context.successOnSecondaryBackground,
  [BUTTON_DANGER_SUBTLE_BORDER]: 'transparent',
  [BUTTON_DANGER_SUBTLE_BG]: context.isLegacy
    ? LEGACY_BUTTON_VALUES.dangerTint
    : context.resolved['--color-theme-accent-emphasis-tint'],
  [BUTTON_DANGER_SUBTLE_FG]: context.dangerOnDangerTint,
  [BUTTON_SUCCESS_SUBTLE_BORDER]: 'transparent',
  [BUTTON_SUCCESS_SUBTLE_BG]: context.isLegacy
    ? LEGACY_BUTTON_VALUES.successTint
    : context.resolved['--color-theme-success-light'],
  [BUTTON_SUCCESS_SUBTLE_FG]: context.successOnSuccessTint,
});

export { getStatusButtonThemeVars };
