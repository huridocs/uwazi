import type { ButtonThemeContext } from '#V2/theme/buttonThemeContext.js';
import { LEGACY_BUTTON_VALUES } from '#V2/theme/buttonThemeContext.js';
import { setRoleTripletVars, setRoleVar } from '#V2/theme/themeRoleVarSetters.js';
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

const getMainButtonThemeVars = (context: ButtonThemeContext): Record<string, string> => {
  const vars: Record<string, string> = {};

  setRoleVar(vars, BUTTON_SECONDARY_HOVER_BG, context.secondaryHoverBackground);

  setRoleTripletVars(vars, BUTTON_PRIMARY_BORDER, BUTTON_PRIMARY_BG, BUTTON_PRIMARY_FG, {
    border: context.primaryBackground,
    bg: context.primaryBackground,
    fg: context.primaryForeground,
  });

  setRoleTripletVars(
    vars,
    BUTTON_PRIMARY_DISABLED_BORDER,
    BUTTON_PRIMARY_DISABLED_BG,
    BUTTON_PRIMARY_DISABLED_FG,
    {
      border: context.primaryDisabledBackground,
      bg: context.primaryDisabledBackground,
      fg: context.primaryDisabledForeground,
    }
  );

  setRoleTripletVars(vars, BUTTON_SECONDARY_BORDER, BUTTON_SECONDARY_BG, BUTTON_SECONDARY_FG, {
    border: context.secondaryBorderOnSurface,
    bg: context.isLegacy ? context.secondaryBackground : 'transparent',
    fg: context.secondaryTextOnButton,
  });

  setRoleTripletVars(vars, BUTTON_GHOST_BORDER, BUTTON_GHOST_BG, BUTTON_GHOST_FG, {
    border: context.isLegacy ? LEGACY_BUTTON_VALUES.border : 'transparent',
    bg: context.isLegacy ? LEGACY_BUTTON_VALUES.surface : 'transparent',
    fg: context.isLegacy ? LEGACY_BUTTON_VALUES.ghostText : context.ghostTextOnSurface,
  });

  setRoleTripletVars(
    vars,
    BUTTON_GHOST_HOVER_BORDER,
    BUTTON_GHOST_HOVER_BG,
    BUTTON_GHOST_HOVER_FG,
    {
      border: context.isLegacy ? context.primaryBackground : 'transparent',
      bg: context.isLegacy
        ? LEGACY_BUTTON_VALUES.secondaryHover
        : context.resolved['--color-theme-bg-warm'],
      fg: context.isLegacy ? context.primaryBackground : context.ghostTextOnSurface,
    }
  );

  setRoleTripletVars(vars, BUTTON_COMPACT_BORDER, BUTTON_COMPACT_BG, BUTTON_COMPACT_FG, {
    border: context.compactBorderOnBackground,
    bg: context.compactBackground,
    fg: context.compactTextOnBackground,
  });

  return vars;
};

export { getMainButtonThemeVars };
