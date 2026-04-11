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

const THEME_VAR = '--color-theme-brand-surface';
const THEME_FOREGROUND_VAR = '--color-theme-brand-surface-foreground';
const THEME_SEPARATOR_VAR = '--color-theme-brand-surface-separator';
const THEME_HOVER_BG = '--color-theme-brand-surface-hover-bg';
const THEME_HOVER_FG = '--color-theme-brand-surface-hover-fg';
const THEME_ACTIVE_BG = '--color-theme-brand-surface-active-bg';
const THEME_ACTIVE_FG = '--color-theme-brand-surface-active-fg';
const EMPHASIS_SOLID_BG = '--color-theme-accent-emphasis-solid';
const EMPHASIS_SOLID_FG = '--color-theme-accent-emphasis-solid-foreground';
const BUTTON_PRIMARY_BORDER = '--color-theme-button-primary-border';
const BUTTON_PRIMARY_BG = '--color-theme-button-primary-bg';
const BUTTON_PRIMARY_FG = '--color-theme-button-primary-fg';
const BUTTON_PRIMARY_DISABLED_BORDER = '--color-theme-button-primary-disabled-border';
const BUTTON_PRIMARY_DISABLED_BG = '--color-theme-button-primary-disabled-bg';
const BUTTON_PRIMARY_DISABLED_FG = '--color-theme-button-primary-disabled-fg';
const BUTTON_SECONDARY_BORDER = '--color-theme-button-secondary-border';
const BUTTON_SECONDARY_BG = '--color-theme-button-secondary-bg';
const BUTTON_SECONDARY_FG = '--color-theme-button-secondary-fg';
const BUTTON_SECONDARY_HOVER_BG = '--color-theme-button-secondary-hover-bg';
const BUTTON_DANGER_BORDER = '--color-theme-button-danger-border';
const BUTTON_DANGER_BG = '--color-theme-button-danger-bg';
const BUTTON_DANGER_FG = '--color-theme-button-danger-fg';
const BUTTON_GHOST_BORDER = '--color-theme-button-ghost-border';
const BUTTON_GHOST_BG = '--color-theme-button-ghost-bg';
const BUTTON_GHOST_FG = '--color-theme-button-ghost-fg';
const BUTTON_COMPACT_BORDER = '--color-theme-button-compact-border';
const BUTTON_COMPACT_BG = '--color-theme-button-compact-bg';
const BUTTON_COMPACT_FG = '--color-theme-button-compact-fg';
const BUTTON_SUCCESS_BORDER = '--color-theme-button-success-border';
const BUTTON_SUCCESS_BG = '--color-theme-button-success-bg';
const BUTTON_SUCCESS_FG = '--color-theme-button-success-fg';
const BUTTON_DANGER_SECONDARY_BORDER = '--color-theme-button-danger-secondary-border';
const BUTTON_DANGER_SECONDARY_BG = '--color-theme-button-danger-secondary-bg';
const BUTTON_DANGER_SECONDARY_FG = '--color-theme-button-danger-secondary-fg';
const BUTTON_SUCCESS_SECONDARY_BORDER = '--color-theme-button-success-secondary-border';
const BUTTON_SUCCESS_SECONDARY_BG = '--color-theme-button-success-secondary-bg';
const BUTTON_SUCCESS_SECONDARY_FG = '--color-theme-button-success-secondary-fg';
const BUTTON_DANGER_SUBTLE_BORDER = '--color-theme-button-danger-subtle-border';
const BUTTON_DANGER_SUBTLE_BG = '--color-theme-button-danger-subtle-bg';
const BUTTON_DANGER_SUBTLE_FG = '--color-theme-button-danger-subtle-fg';
const BUTTON_SUCCESS_SUBTLE_BORDER = '--color-theme-button-success-subtle-border';
const BUTTON_SUCCESS_SUBTLE_BG = '--color-theme-button-success-subtle-bg';
const BUTTON_SUCCESS_SUBTLE_FG = '--color-theme-button-success-subtle-fg';
const EMBEDDED_BUTTON_ORANGE_BORDER = '--color-theme-button-embedded-orange-border';
const EMBEDDED_BUTTON_ORANGE_BG = '--color-theme-button-embedded-orange-bg';
const EMBEDDED_BUTTON_ORANGE_FG = '--color-theme-button-embedded-orange-fg';
const EMBEDDED_BUTTON_GREEN_BORDER = '--color-theme-button-embedded-green-border';
const EMBEDDED_BUTTON_GREEN_BG = '--color-theme-button-embedded-green-bg';
const EMBEDDED_BUTTON_GREEN_FG = '--color-theme-button-embedded-green-fg';
const EMBEDDED_BUTTON_GREEN_DISABLED_BORDER = '--color-theme-button-embedded-green-disabled-border';
const EMBEDDED_BUTTON_GREEN_DISABLED_BG = '--color-theme-button-embedded-green-disabled-bg';
const EMBEDDED_BUTTON_GREEN_DISABLED_FG = '--color-theme-button-embedded-green-disabled-fg';
const EMBEDDED_BUTTON_RED_BORDER = '--color-theme-button-embedded-red-border';
const EMBEDDED_BUTTON_RED_BG = '--color-theme-button-embedded-red-bg';
const EMBEDDED_BUTTON_RED_FG = '--color-theme-button-embedded-red-fg';
const EMBEDDED_BUTTON_INDIGO_BORDER = '--color-theme-button-embedded-indigo-border';
const EMBEDDED_BUTTON_INDIGO_BG = '--color-theme-button-embedded-indigo-bg';
const EMBEDDED_BUTTON_INDIGO_FG = '--color-theme-button-embedded-indigo-fg';
const EMBEDDED_BUTTON_INDIGO_DISABLED_BORDER = '--color-theme-button-embedded-indigo-disabled-border';
const EMBEDDED_BUTTON_INDIGO_DISABLED_BG = '--color-theme-button-embedded-indigo-disabled-bg';
const EMBEDDED_BUTTON_INDIGO_DISABLED_FG = '--color-theme-button-embedded-indigo-disabled-fg';
const EMBEDDED_BUTTON_WHITE_BORDER = '--color-theme-button-embedded-white-border';
const EMBEDDED_BUTTON_WHITE_BG = '--color-theme-button-embedded-white-bg';
const EMBEDDED_BUTTON_WHITE_FG = '--color-theme-button-embedded-white-fg';
const EMBEDDED_BUTTON_WHITE_DISABLED_BG = '--color-theme-button-embedded-white-disabled-bg';
const EMBEDDED_BUTTON_WHITE_DISABLED_FG = '--color-theme-button-embedded-white-disabled-fg';
const TOGGLE_TRACK_BG = '--color-theme-toggle-track-bg';
const TOGGLE_TRACK_ACTIVE_BG = '--color-theme-toggle-track-active-bg';
const TOGGLE_TRACK_DISABLED_ACTIVE_BG = '--color-theme-toggle-track-disabled-active-bg';
const TOGGLE_THUMB_BG = '--color-theme-toggle-thumb-bg';
const TOGGLE_THUMB_BORDER = '--color-theme-toggle-thumb-border';
const CONTROL_BG = '--color-theme-control-bg';
const CONTROL_BG_ERROR = '--color-theme-control-bg-error';
const CONTROL_BG_DISABLED = '--color-theme-control-bg-disabled';
const CONTROL_BORDER = '--color-theme-control-border';
const CONTROL_BORDER_ERROR = '--color-theme-control-border-error';
const CONTROL_BORDER_FOCUS = '--color-theme-control-border-focus';
const CONTROL_TEXT = '--color-theme-control-text';
const CONTROL_TEXT_ERROR = '--color-theme-control-text-error';
const CONTROL_TEXT_MUTED = '--color-theme-control-text-muted';
const CONTROL_PLACEHOLDER = '--color-theme-control-placeholder';
const CONTROL_PRETEXT_BG = '--color-theme-control-pretext-bg';
const CONTROL_PRETEXT_TEXT = '--color-theme-control-pretext-text';
const CONTROL_CLEAR_FG = '--color-theme-control-clear-fg';
const CONTROL_CLEAR_HOVER_FG = '--color-theme-control-clear-hover-fg';
const CONTROL_RING = '--color-theme-control-ring';
const CONTROL_ERROR_RING = '--color-theme-control-error-ring';
const CARD_HEADER_DEFAULT_BG = '--color-theme-card-header-default-bg';
const CARD_HEADER_DEFAULT_FG = '--color-theme-card-header-default-fg';
const CARD_HEADER_BLACK_BG = '--color-theme-card-header-black-bg';
const CARD_HEADER_BLACK_FG = '--color-theme-card-header-black-fg';
const CARD_HEADER_YELLOW_BG = '--color-theme-card-header-yellow-bg';
const CARD_HEADER_YELLOW_FG = '--color-theme-card-header-yellow-fg';
const INFO_BANNER_BG = '--color-theme-info-banner-bg';
const INFO_BANNER_FG = '--color-theme-info-banner-fg';
const INFO_BANNER_BORDER = '--color-theme-info-banner-border';
const WARNING_BANNER_BG = '--color-theme-warning-banner-bg';
const WARNING_BANNER_FG = '--color-theme-warning-banner-fg';
const WARNING_BANNER_BORDER = '--color-theme-warning-banner-border';
const SECTION_HEADER_BG = '--color-theme-section-header-bg';
const SECTION_HEADER_FG = '--color-theme-section-header-fg';
const THEME_MODE_STORAGE_KEY = 'uwazi.themeMode';

type ThemeProviderProps = React.PropsWithChildren<{
  className?: string;
  controlledMode?: ThemeMode;
  style?: React.CSSProperties & Record<string, string>;
}>;

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

const getButtonThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars
): Record<string, string> => {
  const primaryBackground = presetId === 'legacy' ? '#2B56C1' : resolved['--color-theme-text-primary'];
  const primaryForeground = getAccessibleForegroundOnBackground(
    primaryBackground,
    presetId === 'legacy' ? '#FFFFFF' : resolved['--color-theme-bg-primary']
  ).foreground;
  const primaryDisabledBackground =
    presetId === 'legacy'
      ? '#A5B4FC'
      : mixHex(primaryBackground, resolved['--color-theme-bg-surface'], 0.35);
  const primaryDisabledForeground =
    presetId === 'legacy'
      ? '#FFFFFF'
      : getAccessibleForegroundOnBackground(primaryDisabledBackground, primaryForeground).foreground;
  const secondaryBackground = presetId === 'legacy' ? '#FFFFFF' : resolved['--color-theme-bg-surface'];
  const secondaryBorderOnSurface =
    presetId === 'legacy'
      ? primaryBackground
      : getAccessibleForegroundOnBackground(
          resolved['--color-theme-bg-surface'],
          resolved['--color-theme-border-primary'],
          3
        ).foreground;
  const secondaryTextOnButton = getAccessibleForegroundOnBackground(
    secondaryBackground,
    presetId === 'legacy' ? primaryBackground : resolved['--color-theme-text-secondary']
  ).foreground;
  const secondaryHoverBackground =
    presetId === 'legacy' ? '#EEF2FF' : resolved['--color-theme-bg-warm'];
  const ghostTextOnSurface = getAccessibleForegroundOnBackground(
    resolved['--color-theme-bg-surface'],
    presetId === 'legacy' ? '#101828' : resolved['--color-theme-text-tertiary']
  ).foreground;
  const compactBackground = presetId === 'legacy' ? '#F9FAFB' : resolved['--color-theme-bg-warm'];
  const compactBorderOnBackground = getAccessibleForegroundOnBackground(
    compactBackground,
    presetId === 'legacy' ? '#D1D5DB' : resolved['--color-theme-border-soft'],
    3
  ).foreground;
  const compactTextOnBackground = getAccessibleForegroundOnBackground(
    compactBackground,
    presetId === 'legacy' ? '#101828' : resolved['--color-theme-text-secondary']
  ).foreground;
  const successSolidBackground = presetId === 'legacy' ? '#5CB85C' : resolved['--color-theme-success'];
  const successSolidForeground = getAccessibleForegroundOnBackground(
    successSolidBackground,
    '#FFFFFF'
  ).foreground;
  const successSecondaryBackground =
    presetId === 'legacy' ? '#FFFFFF' : resolved['--color-theme-bg-surface'];
  const successOnSecondaryBackground = getAccessibleForegroundOnBackground(
    successSecondaryBackground,
    presetId === 'legacy' ? '#5CB85C' : resolved['--color-theme-success']
  ).foreground;
  const successBorderOnSurface = getAccessibleForegroundOnBackground(
    resolved['--color-theme-bg-surface'],
    presetId === 'legacy' ? '#5CB85C' : resolved['--color-theme-success'],
    3
  ).foreground;
  const dangerSecondaryBackground =
    presetId === 'legacy' ? '#FFFFFF' : resolved['--color-theme-bg-surface'];
  const dangerOnSecondaryBackground = getAccessibleForegroundOnBackground(
    dangerSecondaryBackground,
    presetId === 'legacy' ? '#D9534F' : resolved['--color-theme-accent-emphasis']
  ).foreground;
  const dangerBorderOnSurface = getAccessibleForegroundOnBackground(
    resolved['--color-theme-bg-surface'],
    presetId === 'legacy' ? '#D9534F' : resolved['--color-theme-accent-emphasis'],
    3
  ).foreground;
  const successOnSuccessTint = getAccessibleForegroundOnBackground(
    presetId === 'legacy' ? '#D1FAE5' : resolved['--color-theme-success-light'],
    presetId === 'legacy' ? '#15803D' : resolved['--color-theme-success']
  ).foreground;
  const dangerOnDangerTint = getAccessibleForegroundOnBackground(
    presetId === 'legacy' ? '#FEE2E2' : resolved['--color-theme-accent-emphasis-tint'],
    presetId === 'legacy' ? '#D9534F' : resolved['--color-theme-accent-emphasis']
  ).foreground;
  const dangerSolid = getAccessibleColorPair(
    presetId === 'legacy' ? '#D9534F' : resolved['--color-theme-accent-emphasis']
  );
  if (presetId === 'legacy') {
    return {
      [BUTTON_PRIMARY_BORDER]: primaryBackground,
      [BUTTON_PRIMARY_BG]: primaryBackground,
      [BUTTON_PRIMARY_FG]: primaryForeground,
      [BUTTON_PRIMARY_DISABLED_BORDER]: primaryDisabledBackground,
      [BUTTON_PRIMARY_DISABLED_BG]: primaryDisabledBackground,
      [BUTTON_PRIMARY_DISABLED_FG]: primaryDisabledForeground,
      [BUTTON_SECONDARY_BORDER]: secondaryBorderOnSurface,
      [BUTTON_SECONDARY_BG]: secondaryBackground,
      [BUTTON_SECONDARY_FG]: secondaryTextOnButton,
      [BUTTON_SECONDARY_HOVER_BG]: secondaryHoverBackground,
      [BUTTON_DANGER_BORDER]: dangerSolid.background,
      [BUTTON_DANGER_BG]: dangerSolid.background,
      [BUTTON_DANGER_FG]: dangerSolid.foreground,
      [BUTTON_GHOST_BORDER]: 'transparent',
      [BUTTON_GHOST_BG]: 'transparent',
      [BUTTON_GHOST_FG]: ghostTextOnSurface,
      [BUTTON_COMPACT_BORDER]: compactBorderOnBackground,
      [BUTTON_COMPACT_BG]: compactBackground,
      [BUTTON_COMPACT_FG]: compactTextOnBackground,
      [BUTTON_SUCCESS_BORDER]: successSolidBackground,
      [BUTTON_SUCCESS_BG]: successSolidBackground,
      [BUTTON_SUCCESS_FG]: successSolidForeground,
      [BUTTON_DANGER_SECONDARY_BORDER]: dangerBorderOnSurface,
      [BUTTON_DANGER_SECONDARY_BG]: dangerSecondaryBackground,
      [BUTTON_DANGER_SECONDARY_FG]: dangerOnSecondaryBackground,
      [BUTTON_SUCCESS_SECONDARY_BORDER]: successBorderOnSurface,
      [BUTTON_SUCCESS_SECONDARY_BG]: successSecondaryBackground,
      [BUTTON_SUCCESS_SECONDARY_FG]: successOnSecondaryBackground,
      [BUTTON_DANGER_SUBTLE_BORDER]: 'transparent',
      [BUTTON_DANGER_SUBTLE_BG]: '#FEE2E2',
      [BUTTON_DANGER_SUBTLE_FG]: dangerOnDangerTint,
      [BUTTON_SUCCESS_SUBTLE_BORDER]: 'transparent',
      [BUTTON_SUCCESS_SUBTLE_BG]: '#D1FAE5',
      [BUTTON_SUCCESS_SUBTLE_FG]: successOnSuccessTint,
      [EMBEDDED_BUTTON_ORANGE_BORDER]: '#FED7AA',
      [EMBEDDED_BUTTON_ORANGE_BG]: '#FFF7ED',
      [EMBEDDED_BUTTON_ORANGE_FG]: '#9A3412',
      [EMBEDDED_BUTTON_GREEN_BORDER]: '#BBF7D0',
      [EMBEDDED_BUTTON_GREEN_BG]: '#DCFCE7',
      [EMBEDDED_BUTTON_GREEN_FG]: '#4ADE80',
      [EMBEDDED_BUTTON_GREEN_DISABLED_BORDER]: '#BBF7D0',
      [EMBEDDED_BUTTON_GREEN_DISABLED_BG]: '#F0FDF4',
      [EMBEDDED_BUTTON_GREEN_DISABLED_FG]: '#BBF7D0',
      [EMBEDDED_BUTTON_RED_BORDER]: '#E5E7EB',
      [EMBEDDED_BUTTON_RED_BG]: '#F9FAFB',
      [EMBEDDED_BUTTON_RED_FG]: '#D1D5DB',
      [EMBEDDED_BUTTON_INDIGO_BORDER]: '#C7D2FE',
      [EMBEDDED_BUTTON_INDIGO_BG]: '#E0E7FF',
      [EMBEDDED_BUTTON_INDIGO_FG]: '#3730A3',
      [EMBEDDED_BUTTON_INDIGO_DISABLED_BORDER]: '#C7D2FE',
      [EMBEDDED_BUTTON_INDIGO_DISABLED_BG]: '#EEF2FF',
      [EMBEDDED_BUTTON_INDIGO_DISABLED_FG]: '#C7D2FE',
      [EMBEDDED_BUTTON_WHITE_BORDER]: '#E5E7EB',
      [EMBEDDED_BUTTON_WHITE_BG]: '#FFFFFF',
      [EMBEDDED_BUTTON_WHITE_FG]: '#101828',
      [EMBEDDED_BUTTON_WHITE_DISABLED_BG]: '#F9FAFB',
      [EMBEDDED_BUTTON_WHITE_DISABLED_FG]: '#D1D5DB',
      [TOGGLE_TRACK_BG]: '#E5E7EB',
      [TOGGLE_TRACK_ACTIVE_BG]: '#2B56C1',
      [TOGGLE_TRACK_DISABLED_ACTIVE_BG]: '#A5B4FC',
      [TOGGLE_THUMB_BG]: '#FFFFFF',
      [TOGGLE_THUMB_BORDER]: '#D1D5DB',
    };
  }

  return {
    [BUTTON_PRIMARY_BORDER]: primaryBackground,
    [BUTTON_PRIMARY_BG]: primaryBackground,
    [BUTTON_PRIMARY_FG]: primaryForeground,
    [BUTTON_PRIMARY_DISABLED_BORDER]: primaryDisabledBackground,
    [BUTTON_PRIMARY_DISABLED_BG]: primaryDisabledBackground,
    [BUTTON_PRIMARY_DISABLED_FG]: primaryDisabledForeground,
    [BUTTON_SECONDARY_BORDER]: secondaryBorderOnSurface,
    [BUTTON_SECONDARY_BG]: 'transparent',
    [BUTTON_SECONDARY_FG]: secondaryTextOnButton,
    [BUTTON_SECONDARY_HOVER_BG]: secondaryHoverBackground,
    [BUTTON_DANGER_BORDER]: dangerSolid.background,
    [BUTTON_DANGER_BG]: dangerSolid.background,
    [BUTTON_DANGER_FG]: dangerSolid.foreground,
    [BUTTON_GHOST_BORDER]: 'transparent',
    [BUTTON_GHOST_BG]: 'transparent',
    [BUTTON_GHOST_FG]: ghostTextOnSurface,
    [BUTTON_COMPACT_BORDER]: compactBorderOnBackground,
    [BUTTON_COMPACT_BG]: compactBackground,
    [BUTTON_COMPACT_FG]: compactTextOnBackground,
    [BUTTON_SUCCESS_BORDER]: successSolidBackground,
    [BUTTON_SUCCESS_BG]: successSolidBackground,
    [BUTTON_SUCCESS_FG]: successSolidForeground,
    [BUTTON_DANGER_SECONDARY_BORDER]: dangerBorderOnSurface,
    [BUTTON_DANGER_SECONDARY_BG]: dangerSecondaryBackground,
    [BUTTON_DANGER_SECONDARY_FG]: dangerOnSecondaryBackground,
    [BUTTON_SUCCESS_SECONDARY_BORDER]: successBorderOnSurface,
    [BUTTON_SUCCESS_SECONDARY_BG]: successSecondaryBackground,
    [BUTTON_SUCCESS_SECONDARY_FG]: successOnSecondaryBackground,
    [BUTTON_DANGER_SUBTLE_BORDER]: 'transparent',
    [BUTTON_DANGER_SUBTLE_BG]: resolved['--color-theme-accent-emphasis-tint'],
    [BUTTON_DANGER_SUBTLE_FG]: dangerOnDangerTint,
    [BUTTON_SUCCESS_SUBTLE_BORDER]: 'transparent',
    [BUTTON_SUCCESS_SUBTLE_BG]: resolved['--color-theme-success-light'],
    [BUTTON_SUCCESS_SUBTLE_FG]: successOnSuccessTint,
    [EMBEDDED_BUTTON_ORANGE_BORDER]: '#FED7AA',
    [EMBEDDED_BUTTON_ORANGE_BG]: '#FFF7ED',
    [EMBEDDED_BUTTON_ORANGE_FG]: '#9A3412',
    [EMBEDDED_BUTTON_GREEN_BORDER]: '#BBF7D0',
    [EMBEDDED_BUTTON_GREEN_BG]: '#DCFCE7',
    [EMBEDDED_BUTTON_GREEN_FG]: '#4ADE80',
    [EMBEDDED_BUTTON_GREEN_DISABLED_BORDER]: '#BBF7D0',
    [EMBEDDED_BUTTON_GREEN_DISABLED_BG]: '#F0FDF4',
    [EMBEDDED_BUTTON_GREEN_DISABLED_FG]: '#BBF7D0',
    [EMBEDDED_BUTTON_RED_BORDER]: resolved['--color-theme-border-primary'],
    [EMBEDDED_BUTTON_RED_BG]: resolved['--color-theme-bg-warm'],
    [EMBEDDED_BUTTON_RED_FG]: resolved['--color-theme-border-primary'],
    [EMBEDDED_BUTTON_INDIGO_BORDER]: '#C7D2FE',
    [EMBEDDED_BUTTON_INDIGO_BG]: '#E0E7FF',
    [EMBEDDED_BUTTON_INDIGO_FG]: '#3730A3',
    [EMBEDDED_BUTTON_INDIGO_DISABLED_BORDER]: '#C7D2FE',
    [EMBEDDED_BUTTON_INDIGO_DISABLED_BG]: '#EEF2FF',
    [EMBEDDED_BUTTON_INDIGO_DISABLED_FG]: '#C7D2FE',
    [EMBEDDED_BUTTON_WHITE_BORDER]: resolved['--color-theme-border-primary'],
    [EMBEDDED_BUTTON_WHITE_BG]: resolved['--color-theme-bg-surface'],
    [EMBEDDED_BUTTON_WHITE_FG]: resolved['--color-theme-text-primary'],
    [EMBEDDED_BUTTON_WHITE_DISABLED_BG]: resolved['--color-theme-bg-warm'],
    [EMBEDDED_BUTTON_WHITE_DISABLED_FG]: resolved['--color-theme-border-primary'],
    [TOGGLE_TRACK_BG]: '#E5E7EB',
    [TOGGLE_TRACK_ACTIVE_BG]: resolved['--color-theme-accent-primary'],
    [TOGGLE_TRACK_DISABLED_ACTIVE_BG]: '#A5B4FC',
    [TOGGLE_THUMB_BG]: '#FFFFFF',
    [TOGGLE_THUMB_BORDER]: '#D1D5DB',
  };
};

const getControlThemeVars = (presetId: ThemePresetId, resolved: ResolvedThemeVars): Record<string, string> => ({
  [CONTROL_BG]: presetId === 'legacy' ? '#F9FAFB' : resolved['--color-theme-bg-warm'],
  [CONTROL_BG_ERROR]: presetId === 'legacy' ? '#FEF2F2' : resolved['--color-theme-danger-light'],
  [CONTROL_BG_DISABLED]: resolved['--color-theme-bg-warm'],
  [CONTROL_BORDER]: resolved['--color-theme-border-primary'],
  [CONTROL_BORDER_ERROR]: presetId === 'legacy' ? '#FCA5A5' : resolved['--color-theme-danger'],
  [CONTROL_BORDER_FOCUS]: resolved['--color-theme-accent-primary'],
  [CONTROL_TEXT]: resolved['--color-theme-text-primary'],
  [CONTROL_TEXT_ERROR]: getAccessibleForegroundOnBackground(
    presetId === 'legacy' ? '#FEF2F2' : resolved['--color-theme-danger-light'],
    presetId === 'legacy' ? '#991B1B' : resolved['--color-theme-accent-emphasis']
  ).foreground,
  [CONTROL_TEXT_MUTED]: resolved['--color-theme-text-muted'],
  [CONTROL_PLACEHOLDER]: resolved['--color-theme-text-muted'],
  [CONTROL_PRETEXT_BG]: resolved['--color-theme-bg-muted'],
  [CONTROL_PRETEXT_TEXT]: resolved['--color-theme-text-primary'],
  [CONTROL_CLEAR_FG]: resolved['--color-theme-text-primary'],
  [CONTROL_CLEAR_HOVER_FG]: presetId === 'legacy' ? '#2B56C1' : resolved['--color-theme-accent-primary'],
  [CONTROL_RING]: 'color-mix(in srgb, var(--color-theme-accent-primary) 20%, transparent)',
  [CONTROL_ERROR_RING]: 'color-mix(in srgb, var(--color-theme-danger) 20%, transparent)',
});

const getCardThemeVars = (presetId: ThemePresetId, resolved: ResolvedThemeVars): Record<string, string> => ({
  [CARD_HEADER_DEFAULT_BG]: resolved['--color-theme-bg-warm'],
  [CARD_HEADER_DEFAULT_FG]:
    presetId === 'legacy' ? resolved['--color-theme-accent-primary'] : resolved['--color-theme-text-primary'],
  [CARD_HEADER_BLACK_BG]: resolved['--color-theme-bg-warm'],
  [CARD_HEADER_BLACK_FG]: resolved['--color-theme-text-primary'],
  [CARD_HEADER_YELLOW_BG]:
    presetId === 'legacy' ? '#FEF3C7' : resolved['--color-theme-highlight-yellow'],
  [CARD_HEADER_YELLOW_FG]:
    presetId === 'legacy'
      ? getAccessibleForegroundOnBackground('#FEF3C7', '#92400E').foreground
      : resolved['--color-theme-text-primary'],
});

const getBannerThemeVars = (
  presetId: ThemePresetId,
  resolved: ResolvedThemeVars
): Record<string, string> => ({
  [INFO_BANNER_BG]: presetId === 'legacy' ? '#E0E7FF' : resolved['--color-theme-accent-supporting-tint'],
  [INFO_BANNER_FG]:
    presetId === 'legacy' ? resolved['--color-theme-accent-primary'] : resolved['--color-theme-text-primary'],
  [INFO_BANNER_BORDER]:
    presetId === 'legacy' ? '#A5B4FC' : resolved['--color-theme-accent-supporting'],
  [WARNING_BANNER_BG]:
    presetId === 'legacy' ? '#FEF3C7' : resolved['--color-theme-warning-light'],
  [WARNING_BANNER_FG]:
    presetId === 'legacy'
      ? '#B45309'
      : getAccessibleForegroundOnBackground(
          resolved['--color-theme-warning-light'],
          resolved['--color-theme-warning']
        ).foreground,
  [WARNING_BANNER_BORDER]:
    presetId === 'legacy' ? '#FCD34D' : resolved['--color-theme-warning'],
  [SECTION_HEADER_BG]: resolved['--color-theme-bg-warm'],
  [SECTION_HEADER_FG]:
    presetId === 'legacy' ? resolved['--color-theme-accent-primary'] : resolved['--color-theme-text-primary'],
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
