import { getAccessibleForegroundOnBackground } from '#shared/utils/contrast.js';
import { setRolePairVars, setRoleTripletVars } from '#V2/theme/themeRoleVarSetters.js';
import { getPresetValue } from '#V2/theme/themePresetUtils.js';
import { getThemeRoles, type ThemeRoles } from '#V2/theme/themeRoles.js';
import type { ResolvedThemeVars, ThemePresetId } from '#V2/theme/themes.js';
import {
  CARD_BORDER,
  CARD_HEADER_BLACK_BG,
  CARD_HEADER_BLACK_FG,
  CARD_HEADER_DEFAULT_BG,
  CARD_HEADER_DEFAULT_FG,
  CARD_HEADER_YELLOW_BG,
  CARD_HEADER_YELLOW_FG,
  CARD_RADIUS,
  CARD_SHADOW,
  CONTROL_BG,
  CONTROL_BG_DISABLED,
  CONTROL_BG_ERROR,
  CONTROL_BORDER,
  CONTROL_BORDER_ERROR,
  CONTROL_BORDER_FOCUS,
  CONTROL_CLEAR_FG,
  CONTROL_CLEAR_HOVER_FG,
  CONTROL_ERROR_RING,
  CONTROL_PLACEHOLDER,
  CONTROL_PRETEXT_BG,
  CONTROL_PRETEXT_TEXT,
  CONTROL_RING,
  CONTROL_TEXT,
  CONTROL_TEXT_DISABLED,
  CONTROL_TEXT_ERROR,
  CONTROL_TEXT_MUTED,
  INFO_BANNER_BG,
  INFO_BANNER_BORDER,
  INFO_BANNER_FG,
  SECTION_HEADER_BG,
  SECTION_HEADER_FG,
  WARNING_BANNER_BG,
  WARNING_BANNER_BORDER,
  WARNING_BANNER_FG,
} from '#V2/theme/roleTokens.js';

const getControlThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars,
  roles: ThemeRoles = getThemeRoles(presetId, resolved)
): Record<string, string> => ({
  [CONTROL_BG]: roles.surface.warm,
  [CONTROL_BG_ERROR]: roles.feedback.dangerTint,
  [CONTROL_BG_DISABLED]: roles.surface.warm,
  [CONTROL_BORDER]: roles.border.default,
  [CONTROL_BORDER_ERROR]: getPresetValue(presetId, '#FCA5A5', roles.feedback.danger),
  [CONTROL_BORDER_FOCUS]: roles.border.focus,
  [CONTROL_TEXT]: roles.text.primary,
  [CONTROL_TEXT_DISABLED]: getPresetValue(presetId, '#6B7280', roles.text.muted),
  [CONTROL_TEXT_ERROR]: getAccessibleForegroundOnBackground(
    roles.feedback.dangerTint,
    roles.feedback.danger
  ).foreground,
  [CONTROL_TEXT_MUTED]: roles.text.muted,
  [CONTROL_PLACEHOLDER]: roles.text.muted,
  [CONTROL_PRETEXT_BG]: roles.surface.muted,
  [CONTROL_PRETEXT_TEXT]: roles.text.primary,
  [CONTROL_CLEAR_FG]: roles.text.primary,
  [CONTROL_CLEAR_HOVER_FG]: getPresetValue(presetId, '#2B56C1', roles.action.primary),
  [CONTROL_RING]: 'color-mix(in srgb, var(--color-theme-accent-primary) 20%, transparent)',
  [CONTROL_ERROR_RING]: 'color-mix(in srgb, var(--color-theme-danger) 20%, transparent)',
});

const getSurfaceThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars,
  roles: ThemeRoles = getThemeRoles(presetId, resolved)
): Record<string, string> => ({
  [CARD_BORDER]: getPresetValue(
    presetId,
    'color-mix(in srgb, #E5E7EB 70%, #ffffff)',
    `color-mix(in srgb, ${roles.border.default} 60%, transparent)`
  ),
  [CARD_SHADOW]: getPresetValue(
    presetId,
    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    resolved['--color-theme-card-shadow']
  ),
  [CARD_RADIUS]: getPresetValue(presetId, '0.375rem', resolved['--color-theme-card-radius']),
});

const getCardThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars,
  roles: ThemeRoles = getThemeRoles(presetId, resolved)
): Record<string, string> => {
  const vars: Record<string, string> = {};

  setRolePairVars(vars, CARD_HEADER_DEFAULT_BG, CARD_HEADER_DEFAULT_FG, {
    bg: roles.surface.warm,
    fg: getPresetValue(presetId, roles.action.primary, roles.text.primary),
  });

  setRolePairVars(vars, CARD_HEADER_BLACK_BG, CARD_HEADER_BLACK_FG, {
    bg: roles.surface.warm,
    fg: roles.text.primary,
  });

  setRolePairVars(vars, CARD_HEADER_YELLOW_BG, CARD_HEADER_YELLOW_FG, {
    bg: getPresetValue(presetId, '#FEF3C7', resolved['--color-theme-highlight-yellow']),
    fg: getPresetValue(
      presetId,
      getAccessibleForegroundOnBackground('#FEF3C7', '#92400E').foreground,
      roles.text.primary
    ),
  });

  return vars;
};

const getBannerThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars,
  roles: ThemeRoles = getThemeRoles(presetId, resolved)
): Record<string, string> => {
  const vars: Record<string, string> = {};

  setRoleTripletVars(vars, INFO_BANNER_BORDER, INFO_BANNER_BG, INFO_BANNER_FG, {
    border: getPresetValue(presetId, '#A5B4FC', roles.feedback.info),
    bg: getPresetValue(presetId, '#E0E7FF', roles.feedback.infoTint),
    fg: getPresetValue(presetId, roles.action.primary, roles.text.primary),
  });

  setRoleTripletVars(vars, WARNING_BANNER_BORDER, WARNING_BANNER_BG, WARNING_BANNER_FG, {
    border: getPresetValue(presetId, '#FCD34D', roles.feedback.warning),
    bg: getPresetValue(presetId, '#FEF3C7', roles.feedback.warningTint),
    fg: getPresetValue(
      presetId,
      '#B45309',
      getAccessibleForegroundOnBackground(roles.feedback.warningTint, roles.feedback.warning)
        .foreground
    ),
  });

  setRolePairVars(vars, SECTION_HEADER_BG, SECTION_HEADER_FG, {
    bg: roles.surface.warm,
    fg: getPresetValue(presetId, roles.text.secondary, roles.text.primary),
  });

  return vars;
};

export { getBannerThemeVars, getCardThemeVars, getControlThemeVars, getSurfaceThemeVars };
