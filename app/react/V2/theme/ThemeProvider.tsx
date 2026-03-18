import React from 'react';
import { useAtomValue } from 'jotai';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { getContrastTextColor, mixHex } from '#shared/utils/contrast.js';
import { ACCENT_PRIMARY_KEY, appliedTheme } from '#V2/theme/themes.js';

const THEME_VAR = '--color-theme';
const THEME_FOREGROUND_VAR = '--color-theme-foreground';
const THEME_SEPARATOR_VAR = '--color-theme-separator';
const THEME_HOVER_BG = '--color-theme-hover-bg';
const THEME_HOVER_FG = '--color-theme-hover-fg';
const THEME_ACTIVE_BG = '--color-theme-active-bg';
const THEME_ACTIVE_FG = '--color-theme-active-fg';

export const getDerivedThemeVars = (topbar: string): Record<string, string> => {
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

type ThemeProviderProps = { children: React.ReactNode };

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const settings = useAtomValue(settingsAtom);
  const themeVars = settings.themeVars;
  const enabled =
    typeof window !== 'undefined' && window.__featureFlags__?.themeCustomization;

  if (!enabled) {
    return <>{children}</>;
  }

  const resolved = appliedTheme(themeVars ?? undefined);
  const topbar = resolved[ACCENT_PRIMARY_KEY] ?? '#1A1A1A';
  const style: React.CSSProperties & Record<string, string> = {
    ...resolved,
    ...getDerivedThemeVars(topbar),
  };

  return (
    <div className="tw-content" data-theme-custom style={style}>
      {children}
    </div>
  );
};
