import { getAccessibleForegroundOnBackground } from '#shared/utils/contrast.js';
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

function getPresetValue<T>(presetId: ThemePresetId, legacy: T, current: T) {
  return presetId === 'legacy' ? legacy : current;
}

const getControlThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars,
  roles: ThemeRoles = getThemeRoles(presetId, resolved)
): Record<string, string> => ({
  [CONTROL_BG]: getPresetValue(presetId, '#F9FAFB', roles.surface.warm),
  [CONTROL_BG_ERROR]: getPresetValue(presetId, '#FEF2F2', roles.feedback.dangerTint),
  [CONTROL_BG_DISABLED]: getPresetValue(presetId, '#F9FAFB', roles.surface.warm),
  [CONTROL_BORDER]: roles.border.default,
  [CONTROL_BORDER_ERROR]: getPresetValue(presetId, '#FCA5A5', roles.feedback.danger),
  [CONTROL_BORDER_FOCUS]: roles.border.focus,
  [CONTROL_TEXT]: roles.text.primary,
  [CONTROL_TEXT_DISABLED]: getPresetValue(presetId, '#6B7280', roles.text.muted),
  [CONTROL_TEXT_ERROR]: getAccessibleForegroundOnBackground(
    getPresetValue(presetId, '#FEF2F2', roles.feedback.dangerTint),
    getPresetValue(presetId, '#991B1B', roles.feedback.danger)
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
    '#F3F4F6',
    `color-mix(in srgb, ${roles.border.default} 60%, transparent)`
  ),
  [CARD_SHADOW]: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  [CARD_RADIUS]: getPresetValue(presetId, '0.375rem', '0.5rem'),
});

const getCardThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars,
  roles: ThemeRoles = getThemeRoles(presetId, resolved)
): Record<string, string> => ({
  [CARD_HEADER_DEFAULT_BG]: roles.surface.warm,
  [CARD_HEADER_DEFAULT_FG]: getPresetValue(presetId, roles.action.primary, roles.text.primary),
  [CARD_HEADER_BLACK_BG]: roles.surface.warm,
  [CARD_HEADER_BLACK_FG]: roles.text.primary,
  [CARD_HEADER_YELLOW_BG]: getPresetValue(
    presetId,
    '#FEF3C7',
    resolved['--color-theme-highlight-yellow']
  ),
  [CARD_HEADER_YELLOW_FG]: getPresetValue(
    presetId,
    getAccessibleForegroundOnBackground('#FEF3C7', '#92400E').foreground,
    roles.text.primary
  ),
});

const getBannerThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars,
  roles: ThemeRoles = getThemeRoles(presetId, resolved)
): Record<string, string> => ({
  [INFO_BANNER_BG]: getPresetValue(presetId, '#E0E7FF', roles.feedback.infoTint),
  [INFO_BANNER_FG]: getPresetValue(presetId, roles.action.primary, roles.text.primary),
  [INFO_BANNER_BORDER]: getPresetValue(presetId, '#A5B4FC', roles.feedback.info),
  [WARNING_BANNER_BG]: getPresetValue(presetId, '#FEF3C7', roles.feedback.warningTint),
  [WARNING_BANNER_FG]: getPresetValue(
    presetId,
    '#B45309',
    getAccessibleForegroundOnBackground(roles.feedback.warningTint, roles.feedback.warning)
      .foreground
  ),
  [WARNING_BANNER_BORDER]: getPresetValue(presetId, '#FCD34D', roles.feedback.warning),
  [SECTION_HEADER_BG]: roles.surface.warm,
  [SECTION_HEADER_FG]: getPresetValue(presetId, roles.action.primary, roles.text.primary),
});

export { getBannerThemeVars, getCardThemeVars, getControlThemeVars, getSurfaceThemeVars };
