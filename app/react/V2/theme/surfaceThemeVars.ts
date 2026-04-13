import { getAccessibleForegroundOnBackground } from '#shared/utils/contrast.js';
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
  resolved: ResolvedThemeVars
): Record<string, string> => ({
  [CONTROL_BG]: getPresetValue(presetId, '#F9FAFB', resolved['--color-theme-bg-warm']),
  [CONTROL_BG_ERROR]: getPresetValue(presetId, '#FEF2F2', resolved['--color-theme-danger-light']),
  [CONTROL_BG_DISABLED]: getPresetValue(presetId, '#F9FAFB', resolved['--color-theme-bg-warm']),
  [CONTROL_BORDER]: resolved['--color-theme-border-primary'],
  [CONTROL_BORDER_ERROR]: getPresetValue(presetId, '#FCA5A5', resolved['--color-theme-danger']),
  [CONTROL_BORDER_FOCUS]: resolved['--color-theme-accent-primary'],
  [CONTROL_TEXT]: resolved['--color-theme-text-primary'],
  [CONTROL_TEXT_DISABLED]: getPresetValue(
    presetId,
    '#6B7280',
    resolved['--color-theme-text-muted']
  ),
  [CONTROL_TEXT_ERROR]: getAccessibleForegroundOnBackground(
    getPresetValue(presetId, '#FEF2F2', resolved['--color-theme-danger-light']),
    getPresetValue(presetId, '#991B1B', resolved['--color-theme-accent-emphasis'])
  ).foreground,
  [CONTROL_TEXT_MUTED]: resolved['--color-theme-text-muted'],
  [CONTROL_PLACEHOLDER]: resolved['--color-theme-text-muted'],
  [CONTROL_PRETEXT_BG]: resolved['--color-theme-bg-muted'],
  [CONTROL_PRETEXT_TEXT]: resolved['--color-theme-text-primary'],
  [CONTROL_CLEAR_FG]: resolved['--color-theme-text-primary'],
  [CONTROL_CLEAR_HOVER_FG]: getPresetValue(
    presetId,
    '#2B56C1',
    resolved['--color-theme-accent-primary']
  ),
  [CONTROL_RING]: 'color-mix(in srgb, var(--color-theme-accent-primary) 20%, transparent)',
  [CONTROL_ERROR_RING]: 'color-mix(in srgb, var(--color-theme-danger) 20%, transparent)',
});

const getSurfaceThemeVars = (
  presetId: ThemePresetId,
  _resolved: ResolvedThemeVars
): Record<string, string> => ({
  [CARD_BORDER]: getPresetValue(
    presetId,
    '#F3F4F6',
    'color-mix(in srgb, var(--color-theme-border-primary) 60%, transparent)'
  ),
  [CARD_SHADOW]: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  [CARD_RADIUS]: getPresetValue(presetId, '0.375rem', '0.5rem'),
});

const getCardThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars
): Record<string, string> => ({
  [CARD_HEADER_DEFAULT_BG]: resolved['--color-theme-bg-warm'],
  [CARD_HEADER_DEFAULT_FG]: getPresetValue(
    presetId,
    resolved['--color-theme-accent-primary'],
    resolved['--color-theme-text-primary']
  ),
  [CARD_HEADER_BLACK_BG]: resolved['--color-theme-bg-warm'],
  [CARD_HEADER_BLACK_FG]: resolved['--color-theme-text-primary'],
  [CARD_HEADER_YELLOW_BG]: getPresetValue(
    presetId,
    '#FEF3C7',
    resolved['--color-theme-highlight-yellow']
  ),
  [CARD_HEADER_YELLOW_FG]: getPresetValue(
    presetId,
    getAccessibleForegroundOnBackground('#FEF3C7', '#92400E').foreground,
    resolved['--color-theme-text-primary']
  ),
});

const getBannerThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars
): Record<string, string> => ({
  [INFO_BANNER_BG]: getPresetValue(
    presetId,
    '#E0E7FF',
    resolved['--color-theme-accent-supporting-tint']
  ),
  [INFO_BANNER_FG]: getPresetValue(
    presetId,
    resolved['--color-theme-accent-primary'],
    resolved['--color-theme-text-primary']
  ),
  [INFO_BANNER_BORDER]: getPresetValue(
    presetId,
    '#A5B4FC',
    resolved['--color-theme-accent-supporting']
  ),
  [WARNING_BANNER_BG]: getPresetValue(presetId, '#FEF3C7', resolved['--color-theme-warning-light']),
  [WARNING_BANNER_FG]: getPresetValue(
    presetId,
    '#B45309',
    getAccessibleForegroundOnBackground(
      resolved['--color-theme-warning-light'],
      resolved['--color-theme-warning']
    ).foreground
  ),
  [WARNING_BANNER_BORDER]: getPresetValue(presetId, '#FCD34D', resolved['--color-theme-warning']),
  [SECTION_HEADER_BG]: resolved['--color-theme-bg-warm'],
  [SECTION_HEADER_FG]: getPresetValue(
    presetId,
    resolved['--color-theme-accent-primary'],
    resolved['--color-theme-text-primary']
  ),
});

export { getBannerThemeVars, getCardThemeVars, getControlThemeVars, getSurfaceThemeVars };
