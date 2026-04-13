import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { settingsAtom, themeModeAtom } from '#V2/atoms/index.js';
import {
  getAccessibleColorPair,
  getAccessibleForegroundOnBackground,
  getContrastTextColor,
  mixHex,
} from '#shared/utils/contrast.js';
import {
  ACCENT_PRIMARY_KEY,
  appliedTheme,
  getPresetId,
  type ResolvedThemeVars,
  toCompatibilityVars,
  type ThemeMode,
  type ThemePresetId,
} from '#V2/theme/themes.js';
import {
  BUTTON_COMPACT_BG,
  BUTTON_COMPACT_BORDER,
  BUTTON_COMPACT_FG,
  BUTTON_DANGER_BG,
  BUTTON_DANGER_BORDER,
  BUTTON_DANGER_FG,
  BUTTON_DANGER_SECONDARY_BG,
  BUTTON_DANGER_SECONDARY_BORDER,
  BUTTON_DANGER_SECONDARY_FG,
  BUTTON_DANGER_SUBTLE_BG,
  BUTTON_DANGER_SUBTLE_BORDER,
  BUTTON_DANGER_SUBTLE_FG,
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
  EMPHASIS_SOLID_BG,
  EMPHASIS_SOLID_FG,
  INFO_BANNER_BG,
  INFO_BANNER_BORDER,
  INFO_BANNER_FG,
  SECTION_HEADER_BG,
  SECTION_HEADER_FG,
  THEME_ACTIVE_BG,
  THEME_ACTIVE_FG,
  THEME_FOREGROUND_VAR,
  THEME_HOVER_BG,
  THEME_HOVER_FG,
  THEME_SEPARATOR_VAR,
  THEME_VAR,
  TOGGLE_THUMB_BG,
  TOGGLE_THUMB_BORDER,
  TOGGLE_TRACK_ACTIVE_BG,
  TOGGLE_TRACK_BG,
  TOGGLE_TRACK_DISABLED_ACTIVE_BG,
  WARNING_BANNER_BG,
  WARNING_BANNER_BORDER,
  WARNING_BANNER_FG,
} from '#V2/theme/roleTokens.js';

const THEME_MODE_STORAGE_KEY = 'uwazi.themeMode';

type ThemeProviderProps = React.PropsWithChildren<{
  className?: string;
  controlledMode?: ThemeMode;
  style?: React.CSSProperties & Record<string, string>;
}>;

function getPresetValue<T>(presetId: ThemePresetId, legacy: T, current: T) {
  return presetId === 'legacy' ? legacy : current;
}

const LEGACY_BUTTON_VALUES = {
  primary: '#2B56C1',
  primaryDisabled: '#A5B4FC',
  surface: '#FFFFFF',
  surfaceWarm: '#F9FAFB',
  border: '#E5E7EB',
  softBorder: '#D1D5DB',
  text: '#101828',
  ghostText: '#374151',
  secondaryHover: '#EEF2FF',
  success: '#15803D',
  successHover: '#166534',
  successDisabled: '#86EFAC',
  successTint: '#D1FAE5',
  successTintText: '#15803D',
  danger: '#D9534F',
  dangerTint: '#FEE2E2',
} as const;

type ButtonThemeContext = {
  isLegacy: boolean;
  resolved: ResolvedThemeVars;
  primaryBackground: string;
  primaryForeground: string;
  primaryDisabledBackground: string;
  primaryDisabledForeground: string;
  secondaryBackground: string;
  secondaryBorderOnSurface: string;
  secondaryTextOnButton: string;
  secondaryHoverBackground: string;
  ghostTextOnSurface: string;
  compactBackground: string;
  compactBorderOnBackground: string;
  compactTextOnBackground: string;
  successSolidBackground: string;
  successSolidForeground: string;
  successHoverBackground: string;
  successDisabledBackground: string;
  successDisabledForeground: string;
  successSecondaryBackground: string;
  successOnSecondaryBackground: string;
  successBorderOnSurface: string;
  dangerSecondaryBackground: string;
  dangerOnSecondaryBackground: string;
  dangerBorderOnSurface: string;
  successOnSuccessTint: string;
  dangerOnDangerTint: string;
  dangerSolid: ReturnType<typeof getAccessibleColorPair>;
};

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

const getButtonThemeContext = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars
): ButtonThemeContext => {
  const isLegacy = presetId === 'legacy';
  const primaryBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.primary,
    resolved['--color-theme-text-primary']
  );
  const primaryForeground = getAccessibleForegroundOnBackground(
    primaryBackground,
    getPresetValue(presetId, LEGACY_BUTTON_VALUES.surface, resolved['--color-theme-bg-primary'])
  ).foreground;
  const primaryDisabledBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.primaryDisabled,
    mixHex(primaryBackground, resolved['--color-theme-bg-surface'], 0.35)
  );
  const primaryDisabledForeground = isLegacy
    ? LEGACY_BUTTON_VALUES.surface
    : getAccessibleForegroundOnBackground(primaryDisabledBackground, primaryForeground).foreground;
  const secondaryBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.surface,
    resolved['--color-theme-bg-surface']
  );
  const secondaryBorderOnSurface = isLegacy
    ? primaryBackground
    : getAccessibleForegroundOnBackground(
        resolved['--color-theme-bg-surface'],
        resolved['--color-theme-border-primary'],
        3
      ).foreground;
  const secondaryTextOnButton = getAccessibleForegroundOnBackground(
    secondaryBackground,
    getPresetValue(presetId, primaryBackground, resolved['--color-theme-text-secondary'])
  ).foreground;
  const secondaryHoverBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.secondaryHover,
    resolved['--color-theme-bg-warm']
  );
  const ghostTextOnSurface = getAccessibleForegroundOnBackground(
    resolved['--color-theme-bg-surface'],
    getPresetValue(presetId, LEGACY_BUTTON_VALUES.text, resolved['--color-theme-text-tertiary'])
  ).foreground;
  const compactBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.surfaceWarm,
    resolved['--color-theme-bg-warm']
  );
  const compactBorderOnBackground = getAccessibleForegroundOnBackground(
    compactBackground,
    getPresetValue(
      presetId,
      LEGACY_BUTTON_VALUES.softBorder,
      resolved['--color-theme-border-soft']
    ),
    3
  ).foreground;
  const compactTextOnBackground = getAccessibleForegroundOnBackground(
    compactBackground,
    getPresetValue(presetId, LEGACY_BUTTON_VALUES.text, resolved['--color-theme-text-secondary'])
  ).foreground;
  const successSolidBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.success,
    resolved['--color-theme-success']
  );
  const successHoverBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.successHover,
    mixHex(successSolidBackground, '#000000', 0.08)
  );
  const successSolidForeground = getAccessibleForegroundOnBackground(
    successSolidBackground,
    LEGACY_BUTTON_VALUES.surface
  ).foreground;
  const successDisabledBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.successDisabled,
    mixHex(successSolidBackground, resolved['--color-theme-bg-surface'], 0.35)
  );
  const successDisabledForeground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.surface,
    getAccessibleForegroundOnBackground(successDisabledBackground, successSolidForeground)
      .foreground
  );
  const successSecondaryBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.surface,
    resolved['--color-theme-bg-surface']
  );
  const successOnSecondaryBackground = getAccessibleForegroundOnBackground(
    successSecondaryBackground,
    getPresetValue(presetId, LEGACY_BUTTON_VALUES.success, resolved['--color-theme-success'])
  ).foreground;
  const successBorderOnSurface = getAccessibleForegroundOnBackground(
    resolved['--color-theme-bg-surface'],
    getPresetValue(presetId, LEGACY_BUTTON_VALUES.success, resolved['--color-theme-success']),
    3
  ).foreground;
  const dangerSecondaryBackground = getPresetValue(
    presetId,
    LEGACY_BUTTON_VALUES.surface,
    resolved['--color-theme-bg-surface']
  );
  const dangerOnSecondaryBackground = getAccessibleForegroundOnBackground(
    dangerSecondaryBackground,
    getPresetValue(presetId, LEGACY_BUTTON_VALUES.danger, resolved['--color-theme-accent-emphasis'])
  ).foreground;
  const dangerBorderOnSurface = getAccessibleForegroundOnBackground(
    resolved['--color-theme-bg-surface'],
    getPresetValue(
      presetId,
      LEGACY_BUTTON_VALUES.danger,
      resolved['--color-theme-accent-emphasis']
    ),
    3
  ).foreground;
  const successOnSuccessTint = getAccessibleForegroundOnBackground(
    getPresetValue(
      presetId,
      LEGACY_BUTTON_VALUES.successTint,
      resolved['--color-theme-success-light']
    ),
    getPresetValue(
      presetId,
      LEGACY_BUTTON_VALUES.successTintText,
      resolved['--color-theme-success']
    )
  ).foreground;
  const dangerOnDangerTint = getAccessibleForegroundOnBackground(
    getPresetValue(
      presetId,
      LEGACY_BUTTON_VALUES.dangerTint,
      resolved['--color-theme-accent-emphasis-tint']
    ),
    getPresetValue(presetId, LEGACY_BUTTON_VALUES.danger, resolved['--color-theme-accent-emphasis'])
  ).foreground;
  const dangerSolid = getAccessibleColorPair(
    getPresetValue(presetId, LEGACY_BUTTON_VALUES.danger, resolved['--color-theme-accent-emphasis'])
  );
  return {
    isLegacy,
    resolved,
    primaryBackground,
    primaryForeground,
    primaryDisabledBackground,
    primaryDisabledForeground,
    secondaryBackground,
    secondaryBorderOnSurface,
    secondaryTextOnButton,
    secondaryHoverBackground,
    ghostTextOnSurface,
    compactBackground,
    compactBorderOnBackground,
    compactTextOnBackground,
    successSolidBackground,
    successSolidForeground,
    successHoverBackground,
    successDisabledBackground,
    successDisabledForeground,
    successSecondaryBackground,
    successOnSecondaryBackground,
    successBorderOnSurface,
    dangerSecondaryBackground,
    dangerOnSecondaryBackground,
    dangerBorderOnSurface,
    successOnSuccessTint,
    dangerOnDangerTint,
    dangerSolid,
  };
};

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

const getEmbeddedButtonThemeVars = (context: ButtonThemeContext): Record<string, string> => ({
  [EMBEDDED_BUTTON_ORANGE_BORDER]: '#FED7AA',
  [EMBEDDED_BUTTON_ORANGE_BG]: '#FFF7ED',
  [EMBEDDED_BUTTON_ORANGE_FG]: '#9A3412',
  [EMBEDDED_BUTTON_GREEN_BORDER]: '#BBF7D0',
  [EMBEDDED_BUTTON_GREEN_BG]: '#DCFCE7',
  [EMBEDDED_BUTTON_GREEN_FG]: '#4ADE80',
  [EMBEDDED_BUTTON_GREEN_DISABLED_BORDER]: '#BBF7D0',
  [EMBEDDED_BUTTON_GREEN_DISABLED_BG]: '#F0FDF4',
  [EMBEDDED_BUTTON_GREEN_DISABLED_FG]: '#BBF7D0',
  [EMBEDDED_BUTTON_RED_BORDER]: context.isLegacy
    ? LEGACY_BUTTON_VALUES.border
    : context.resolved['--color-theme-border-primary'],
  [EMBEDDED_BUTTON_RED_BG]: context.isLegacy
    ? LEGACY_BUTTON_VALUES.surfaceWarm
    : context.resolved['--color-theme-bg-warm'],
  [EMBEDDED_BUTTON_RED_FG]: context.isLegacy
    ? LEGACY_BUTTON_VALUES.softBorder
    : context.resolved['--color-theme-border-primary'],
  [EMBEDDED_BUTTON_INDIGO_BORDER]: '#C7D2FE',
  [EMBEDDED_BUTTON_INDIGO_BG]: '#E0E7FF',
  [EMBEDDED_BUTTON_INDIGO_FG]: '#3730A3',
  [EMBEDDED_BUTTON_INDIGO_DISABLED_BORDER]: '#C7D2FE',
  [EMBEDDED_BUTTON_INDIGO_DISABLED_BG]: '#EEF2FF',
  [EMBEDDED_BUTTON_INDIGO_DISABLED_FG]: '#C7D2FE',
  [EMBEDDED_BUTTON_WHITE_BORDER]: context.isLegacy
    ? LEGACY_BUTTON_VALUES.border
    : context.resolved['--color-theme-border-primary'],
  [EMBEDDED_BUTTON_WHITE_BG]: context.isLegacy
    ? LEGACY_BUTTON_VALUES.surface
    : context.resolved['--color-theme-bg-surface'],
  [EMBEDDED_BUTTON_WHITE_FG]: context.isLegacy
    ? LEGACY_BUTTON_VALUES.text
    : context.resolved['--color-theme-text-primary'],
  [EMBEDDED_BUTTON_WHITE_DISABLED_BG]: context.isLegacy
    ? LEGACY_BUTTON_VALUES.surfaceWarm
    : context.resolved['--color-theme-bg-warm'],
  [EMBEDDED_BUTTON_WHITE_DISABLED_FG]: context.isLegacy
    ? LEGACY_BUTTON_VALUES.softBorder
    : context.resolved['--color-theme-border-primary'],
});

const getToggleThemeVars = (context: ButtonThemeContext): Record<string, string> => ({
  [TOGGLE_TRACK_BG]: LEGACY_BUTTON_VALUES.border,
  [TOGGLE_TRACK_ACTIVE_BG]: context.isLegacy
    ? LEGACY_BUTTON_VALUES.primary
    : context.resolved['--color-theme-accent-primary'],
  [TOGGLE_TRACK_DISABLED_ACTIVE_BG]: LEGACY_BUTTON_VALUES.primaryDisabled,
  [TOGGLE_THUMB_BG]: LEGACY_BUTTON_VALUES.surface,
  [TOGGLE_THUMB_BORDER]: LEGACY_BUTTON_VALUES.softBorder,
});

const getButtonThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars
): Record<string, string> => {
  const context = getButtonThemeContext(presetId, resolved);
  return {
    ...getMainButtonThemeVars(context),
    ...getStatusButtonThemeVars(context),
    ...getEmbeddedButtonThemeVars(context),
    ...getToggleThemeVars(context),
  };
};

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

const ThemeProvider = ({ children, className, controlledMode, style }: ThemeProviderProps) => {
  const settings = useAtomValue(settingsAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const resolvedThemeMode = controlledMode ?? themeMode;
  const enabled = Boolean(settings.themeCustomization);
  const presetId = getPresetId(settings.themeVars ?? undefined, enabled);
  const resolved = appliedTheme(settings.themeVars ?? undefined, resolvedThemeMode, enabled);
  const topbar = resolved[ACCENT_PRIMARY_KEY] ?? '#1A1A1A';
  const themeVarsStyle: React.CSSProperties & Record<string, string> = {
    ...resolved,
    ...toCompatibilityVars(resolved),
    ...getDerivedThemeVars(topbar),
    ...getActionThemeVars(resolved),
    ...getButtonThemeVars(presetId, resolved),
    ...getControlThemeVars(presetId, resolved),
    ...getSurfaceThemeVars(presetId, resolved),
    ...getCardThemeVars(presetId, resolved),
    ...getBannerThemeVars(presetId, resolved),
  };

  React.useEffect(() => {
    if (controlledMode && themeMode !== controlledMode) {
      setThemeMode(controlledMode);
    }
  }, [controlledMode, setThemeMode, themeMode]);

  React.useEffect(() => {
    if (controlledMode) return;
    if (typeof window === 'undefined') return;
    const storedThemeMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (storedThemeMode === 'light' || storedThemeMode === 'dark') {
      setThemeMode(storedThemeMode);
      return;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeMode('dark');
    }
  }, [setThemeMode]);

  React.useEffect(() => {
    if (controlledMode) return;
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, resolvedThemeMode);
  }, [controlledMode, resolvedThemeMode]);

  return (
    <div
      className={['tw-content', resolvedThemeMode === 'dark' ? 'dark' : '', className]
        .filter(Boolean)
        .join(' ')}
      data-theme-custom={enabled ? true : undefined}
      data-theme-mode={resolvedThemeMode}
      style={{ colorScheme: resolvedThemeMode, ...themeVarsStyle, ...style }}
    >
      {children}
    </div>
  );
};

export {
  ThemeProvider,
  getActionThemeVars,
  getBannerThemeVars,
  getButtonThemeVars,
  getCardThemeVars,
  getDerivedThemeVars,
};
