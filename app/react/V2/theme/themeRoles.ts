import { getAccessibleForegroundOnBackground, mixHex } from '#shared/utils/contrast.js';
import type { ResolvedThemeVars, ThemePresetId } from '#V2/theme/themes.js';

type ThemeRoles = {
  surface: {
    page: string;
    raised: string;
    warm: string;
    muted: string;
    overlay: string;
    selected: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
    onSolid: string;
  };
  border: {
    default: string;
    soft: string;
    interactive: string;
    focus: string;
  };
  action: {
    primary: string;
    primaryHover: string;
    primaryFg: string;
    secondaryBg: string;
    secondaryFg: string;
    secondaryHover: string;
  };
  feedback: {
    info: string;
    infoTint: string;
    success: string;
    successTint: string;
    warning: string;
    warningTint: string;
    danger: string;
    dangerTint: string;
  };
  chrome: {
    appBar: string;
    appBarHover: string;
    appBarActive: string;
    appBarFg: string;
    separator: string;
    settingsRailBg: string;
    settingsNavItemActiveBg: string;
  };
};

const getThemeRoles = (presetId: ThemePresetId, resolved: ResolvedThemeVars): ThemeRoles => {
  const actionPrimary = resolved['--color-theme-accent-primary'];
  const primaryFg = getAccessibleForegroundOnBackground(
    actionPrimary,
    presetId === 'legacy' ? '#FFFFFF' : resolved['--color-theme-bg-primary']
  ).foreground;
  const appBarFg = resolved['--color-theme-text-primary'];

  return {
    surface: {
      page: resolved['--color-theme-bg-primary'],
      raised: resolved['--color-theme-bg-surface'],
      warm: resolved['--color-theme-bg-warm'],
      muted: resolved['--color-theme-bg-muted'],
      overlay: resolved['--color-theme-bg-overlay'],
      selected: resolved['--color-theme-bg-selected'],
    },
    text: {
      primary: resolved['--color-theme-text-primary'],
      secondary: resolved['--color-theme-text-secondary'],
      tertiary: resolved['--color-theme-text-tertiary'],
      muted: resolved['--color-theme-text-muted'],
      onSolid: primaryFg,
    },
    border: {
      default: resolved['--color-theme-border-primary'],
      soft: resolved['--color-theme-border-soft'],
      interactive: actionPrimary,
      focus: actionPrimary,
    },
    action: {
      primary: actionPrimary,
      primaryHover: mixHex(actionPrimary, '#000000', 0.08),
      primaryFg,
      secondaryBg: resolved['--color-theme-bg-surface'],
      secondaryFg: presetId === 'legacy' ? actionPrimary : resolved['--color-theme-text-secondary'],
      secondaryHover: presetId === 'legacy' ? '#EEF2FF' : resolved['--color-theme-bg-warm'],
    },
    feedback: {
      info: resolved['--color-theme-accent-supporting'],
      infoTint: resolved['--color-theme-accent-supporting-tint'],
      success: resolved['--color-theme-success'],
      successTint: resolved['--color-theme-success-light'],
      warning: resolved['--color-theme-warning'],
      warningTint: resolved['--color-theme-warning-light'],
      danger: resolved['--color-theme-accent-emphasis'],
      dangerTint: resolved['--color-theme-accent-emphasis-tint'],
    },
    chrome: {
      appBar: resolved['--color-theme-bg-surface'],
      appBarHover: resolved['--color-theme-bg-warm'],
      appBarActive: resolved['--color-theme-bg-muted'],
      appBarFg,
      separator: resolved['--color-theme-border-primary'],
      settingsRailBg: resolved['--color-theme-bg-muted'],
      settingsNavItemActiveBg: resolved['--color-theme-bg-selected'],
    },
  };
};

const getThemeRoleVars = (roles: ThemeRoles): Record<string, string> => ({
  '--color-theme-surface-page': roles.surface.page,
  '--color-theme-surface-raised': roles.surface.raised,
  '--color-theme-surface-warm': roles.surface.warm,
  '--color-theme-surface-muted': roles.surface.muted,
  '--color-theme-surface-overlay': roles.surface.overlay,
  '--color-theme-surface-selected': roles.surface.selected,
  '--color-theme-text-on-solid': roles.text.onSolid,
  '--color-theme-border-default': roles.border.default,
  '--color-theme-border-interactive': roles.border.interactive,
  '--color-theme-action-primary': roles.action.primary,
  '--color-theme-action-primary-hover': roles.action.primaryHover,
  '--color-theme-action-primary-fg': roles.action.primaryFg,
  '--color-theme-action-secondary-bg': roles.action.secondaryBg,
  '--color-theme-action-secondary-fg': roles.action.secondaryFg,
  '--color-theme-action-secondary-hover': roles.action.secondaryHover,
  '--color-theme-feedback-info': roles.feedback.info,
  '--color-theme-feedback-info-tint': roles.feedback.infoTint,
  '--color-theme-feedback-success': roles.feedback.success,
  '--color-theme-feedback-success-tint': roles.feedback.successTint,
  '--color-theme-feedback-warning': roles.feedback.warning,
  '--color-theme-feedback-warning-tint': roles.feedback.warningTint,
  '--color-theme-feedback-danger': roles.feedback.danger,
  '--color-theme-feedback-danger-tint': roles.feedback.dangerTint,
  '--color-theme-chrome-app-bar': roles.chrome.appBar,
  '--color-theme-chrome-app-bar-hover': roles.chrome.appBarHover,
  '--color-theme-chrome-app-bar-active': roles.chrome.appBarActive,
  '--color-theme-chrome-app-bar-fg': roles.chrome.appBarFg,
  '--color-theme-chrome-app-bar-separator': roles.chrome.separator,
  '--color-theme-chrome-settings-rail-bg': roles.chrome.settingsRailBg,
  '--color-theme-chrome-settings-nav-item-active-bg': roles.chrome.settingsNavItemActiveBg,
});

export { getThemeRoles, getThemeRoleVars };
export type { ThemeRoles };
