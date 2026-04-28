import type { ButtonThemeContext } from '#V2/theme/buttonThemeContext.js';
import { LEGACY_BUTTON_VALUES } from '#V2/theme/buttonThemeContext.js';
import { setRoleTripletVars, setRoleVar } from '#V2/theme/themeRoleVarSetters.js';
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

const getStatusButtonThemeVars = (context: ButtonThemeContext): Record<string, string> => {
  const vars: Record<string, string> = {};

  setRoleVar(vars, BUTTON_SUCCESS_HOVER_BG, context.successHoverBackground);

  setRoleTripletVars(vars, BUTTON_DANGER_BORDER, BUTTON_DANGER_BG, BUTTON_DANGER_FG, {
    border: context.dangerSolid.background,
    bg: context.dangerSolid.background,
    fg: context.dangerSolid.foreground,
  });

  setRoleTripletVars(vars, BUTTON_SUCCESS_BORDER, BUTTON_SUCCESS_BG, BUTTON_SUCCESS_FG, {
    border: context.successSolidBackground,
    bg: context.successSolidBackground,
    fg: context.successSolidForeground,
  });

  setRoleTripletVars(
    vars,
    BUTTON_SUCCESS_DISABLED_BORDER,
    BUTTON_SUCCESS_DISABLED_BG,
    BUTTON_SUCCESS_DISABLED_FG,
    {
      border: context.successDisabledBackground,
      bg: context.successDisabledBackground,
      fg: context.successDisabledForeground,
    }
  );

  setRoleTripletVars(
    vars,
    BUTTON_DANGER_SECONDARY_BORDER,
    BUTTON_DANGER_SECONDARY_BG,
    BUTTON_DANGER_SECONDARY_FG,
    {
      border: context.dangerBorderOnSurface,
      bg: context.dangerSecondaryBackground,
      fg: context.dangerOnSecondaryBackground,
    }
  );

  setRoleTripletVars(
    vars,
    BUTTON_SUCCESS_SECONDARY_BORDER,
    BUTTON_SUCCESS_SECONDARY_BG,
    BUTTON_SUCCESS_SECONDARY_FG,
    {
      border: context.successBorderOnSurface,
      bg: context.successSecondaryBackground,
      fg: context.successOnSecondaryBackground,
    }
  );

  setRoleTripletVars(
    vars,
    BUTTON_DANGER_SUBTLE_BORDER,
    BUTTON_DANGER_SUBTLE_BG,
    BUTTON_DANGER_SUBTLE_FG,
    {
      border: 'transparent',
      bg: context.isLegacy
        ? LEGACY_BUTTON_VALUES.dangerTint
        : context.resolved['--color-theme-accent-emphasis-tint'],
      fg: context.dangerOnDangerTint,
    }
  );

  setRoleTripletVars(
    vars,
    BUTTON_SUCCESS_SUBTLE_BORDER,
    BUTTON_SUCCESS_SUBTLE_BG,
    BUTTON_SUCCESS_SUBTLE_FG,
    {
      border: 'transparent',
      bg: context.isLegacy
        ? LEGACY_BUTTON_VALUES.successTint
        : context.resolved['--color-theme-success-light'],
      fg: context.successOnSuccessTint,
    }
  );

  return vars;
};

export { getStatusButtonThemeVars };
