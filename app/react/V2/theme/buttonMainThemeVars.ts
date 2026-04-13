import type { ButtonThemeContext } from '#V2/theme/buttonThemeContext.js';
import { LEGACY_BUTTON_VALUES } from '#V2/theme/buttonThemeContext.js';
import {
  BUTTON_COMPACT_BG,
  BUTTON_COMPACT_BORDER,
  BUTTON_COMPACT_FG,
  BUTTON_GHOST_BG,
  BUTTON_GHOST_BORDER,
  BUTTON_GHOST_FG,
  BUTTON_GHOST_HOVER_BG,
  BUTTON_GHOST_HOVER_BORDER,
  BUTTON_GHOST_HOVER_FG,
  BUTTON_PRIMARY_BG,
  BUTTON_PRIMARY_BORDER,
  BUTTON_PRIMARY_DISABLED_BG,
  BUTTON_PRIMARY_DISABLED_BORDER,
  BUTTON_PRIMARY_DISABLED_FG,
  BUTTON_PRIMARY_FG,
  BUTTON_SECONDARY_BG,
  BUTTON_SECONDARY_BORDER,
  BUTTON_SECONDARY_FG,
  BUTTON_SECONDARY_HOVER_BG,
} from '#V2/theme/roleTokens.js';

const getMainButtonThemeVars = (context: ButtonThemeContext): Record<string, string> => ({
  [BUTTON_PRIMARY_BORDER]: context.primaryBackground,
  [BUTTON_PRIMARY_BG]: context.primaryBackground,
  [BUTTON_PRIMARY_FG]: context.primaryForeground,
  [BUTTON_PRIMARY_DISABLED_BORDER]: context.primaryDisabledBackground,
  [BUTTON_PRIMARY_DISABLED_BG]: context.primaryDisabledBackground,
  [BUTTON_PRIMARY_DISABLED_FG]: context.primaryDisabledForeground,
  [BUTTON_SECONDARY_BORDER]: context.secondaryBorderOnSurface,
  [BUTTON_SECONDARY_BG]: context.isLegacy ? context.secondaryBackground : 'transparent',
  [BUTTON_SECONDARY_FG]: context.secondaryTextOnButton,
  [BUTTON_SECONDARY_HOVER_BG]: context.secondaryHoverBackground,
  [BUTTON_GHOST_BORDER]: context.isLegacy ? LEGACY_BUTTON_VALUES.border : 'transparent',
  [BUTTON_GHOST_BG]: context.isLegacy ? LEGACY_BUTTON_VALUES.surface : 'transparent',
  [BUTTON_GHOST_FG]: context.isLegacy ? LEGACY_BUTTON_VALUES.ghostText : context.ghostTextOnSurface,
  [BUTTON_GHOST_HOVER_BORDER]: context.isLegacy ? context.primaryBackground : 'transparent',
  [BUTTON_GHOST_HOVER_BG]: context.isLegacy
    ? LEGACY_BUTTON_VALUES.secondaryHover
    : context.resolved['--color-theme-bg-warm'],
  [BUTTON_GHOST_HOVER_FG]: context.isLegacy
    ? context.primaryBackground
    : context.ghostTextOnSurface,
  [BUTTON_COMPACT_BORDER]: context.compactBorderOnBackground,
  [BUTTON_COMPACT_BG]: context.compactBackground,
  [BUTTON_COMPACT_FG]: context.compactTextOnBackground,
});

export { getMainButtonThemeVars };
