import type { ButtonThemeContext } from '#V2/theme/buttonThemeContext.js';
import { LEGACY_BUTTON_VALUES } from '#V2/theme/buttonThemeContext.js';
import { setRolePairVars, setRoleTripletVars } from '#V2/theme/themeRoleVarSetters.js';
import type { ThemeRoles } from '#V2/theme/themeRoles.js';
import {
  EMBEDDED_BUTTON_GREEN_BG,
  EMBEDDED_BUTTON_GREEN_BORDER,
  EMBEDDED_BUTTON_GREEN_DISABLED_BG,
  EMBEDDED_BUTTON_GREEN_DISABLED_BORDER,
  EMBEDDED_BUTTON_GREEN_DISABLED_FG,
  EMBEDDED_BUTTON_GREEN_FG,
  EMBEDDED_BUTTON_INDIGO_BG,
  EMBEDDED_BUTTON_INDIGO_BORDER,
  EMBEDDED_BUTTON_INDIGO_DISABLED_BG,
  EMBEDDED_BUTTON_INDIGO_DISABLED_BORDER,
  EMBEDDED_BUTTON_INDIGO_DISABLED_FG,
  EMBEDDED_BUTTON_INDIGO_FG,
  EMBEDDED_BUTTON_ORANGE_BG,
  EMBEDDED_BUTTON_ORANGE_BORDER,
  EMBEDDED_BUTTON_ORANGE_FG,
  EMBEDDED_BUTTON_RED_BG,
  EMBEDDED_BUTTON_RED_BORDER,
  EMBEDDED_BUTTON_RED_FG,
  EMBEDDED_BUTTON_WHITE_BG,
  EMBEDDED_BUTTON_WHITE_BORDER,
  EMBEDDED_BUTTON_WHITE_DISABLED_BG,
  EMBEDDED_BUTTON_WHITE_DISABLED_FG,
  EMBEDDED_BUTTON_WHITE_FG,
  TOGGLE_THUMB_BG,
  TOGGLE_THUMB_BORDER,
  TOGGLE_TRACK_ACTIVE_BG,
  TOGGLE_TRACK_BG,
  TOGGLE_TRACK_DISABLED_ACTIVE_BG,
} from '#V2/theme/roleTokens.js';

const getEmbeddedButtonThemeVars = (
  context: ButtonThemeContext,
  roles: ThemeRoles
): Record<string, string> => {
  const vars: Record<string, string> = {};

  setRolePairVars(vars, EMBEDDED_BUTTON_WHITE_DISABLED_BG, EMBEDDED_BUTTON_WHITE_DISABLED_FG, {
    bg: context.isLegacy ? LEGACY_BUTTON_VALUES.surfaceWarm : roles.surface.warm,
    fg: context.isLegacy ? LEGACY_BUTTON_VALUES.softBorder : roles.border.default,
  });

  setRoleTripletVars(
    vars,
    EMBEDDED_BUTTON_ORANGE_BORDER,
    EMBEDDED_BUTTON_ORANGE_BG,
    EMBEDDED_BUTTON_ORANGE_FG,
    {
      border: '#FED7AA',
      bg: '#FFF7ED',
      fg: '#9A3412',
    }
  );

  setRoleTripletVars(
    vars,
    EMBEDDED_BUTTON_GREEN_BORDER,
    EMBEDDED_BUTTON_GREEN_BG,
    EMBEDDED_BUTTON_GREEN_FG,
    {
      border: '#BBF7D0',
      bg: '#DCFCE7',
      fg: '#4ADE80',
    }
  );

  setRoleTripletVars(
    vars,
    EMBEDDED_BUTTON_GREEN_DISABLED_BORDER,
    EMBEDDED_BUTTON_GREEN_DISABLED_BG,
    EMBEDDED_BUTTON_GREEN_DISABLED_FG,
    {
      border: '#BBF7D0',
      bg: '#F0FDF4',
      fg: '#BBF7D0',
    }
  );

  setRoleTripletVars(
    vars,
    EMBEDDED_BUTTON_RED_BORDER,
    EMBEDDED_BUTTON_RED_BG,
    EMBEDDED_BUTTON_RED_FG,
    {
      border: context.isLegacy ? LEGACY_BUTTON_VALUES.border : roles.border.default,
      bg: context.isLegacy ? LEGACY_BUTTON_VALUES.surfaceWarm : roles.surface.warm,
      fg: context.isLegacy ? LEGACY_BUTTON_VALUES.softBorder : roles.border.default,
    }
  );

  setRoleTripletVars(
    vars,
    EMBEDDED_BUTTON_INDIGO_BORDER,
    EMBEDDED_BUTTON_INDIGO_BG,
    EMBEDDED_BUTTON_INDIGO_FG,
    {
      border: '#C7D2FE',
      bg: '#E0E7FF',
      fg: '#3730A3',
    }
  );

  setRoleTripletVars(
    vars,
    EMBEDDED_BUTTON_INDIGO_DISABLED_BORDER,
    EMBEDDED_BUTTON_INDIGO_DISABLED_BG,
    EMBEDDED_BUTTON_INDIGO_DISABLED_FG,
    {
      border: '#C7D2FE',
      bg: '#EEF2FF',
      fg: '#C7D2FE',
    }
  );

  setRoleTripletVars(
    vars,
    EMBEDDED_BUTTON_WHITE_BORDER,
    EMBEDDED_BUTTON_WHITE_BG,
    EMBEDDED_BUTTON_WHITE_FG,
    {
      border: context.isLegacy ? LEGACY_BUTTON_VALUES.border : roles.border.default,
      bg: context.isLegacy ? LEGACY_BUTTON_VALUES.surface : roles.surface.raised,
      fg: context.isLegacy ? LEGACY_BUTTON_VALUES.text : roles.text.primary,
    }
  );

  return vars;
};

const getToggleThemeVars = (
  context: ButtonThemeContext,
  roles: ThemeRoles
): Record<string, string> => ({
  [TOGGLE_TRACK_BG]: LEGACY_BUTTON_VALUES.border,
  [TOGGLE_TRACK_ACTIVE_BG]: context.isLegacy ? LEGACY_BUTTON_VALUES.primary : roles.action.primary,
  [TOGGLE_TRACK_DISABLED_ACTIVE_BG]: LEGACY_BUTTON_VALUES.primaryDisabled,
  [TOGGLE_THUMB_BG]: LEGACY_BUTTON_VALUES.surface,
  [TOGGLE_THUMB_BORDER]: LEGACY_BUTTON_VALUES.softBorder,
});

export { getEmbeddedButtonThemeVars, getToggleThemeVars };
