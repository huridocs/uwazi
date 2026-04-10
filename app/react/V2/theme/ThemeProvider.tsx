import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { settingsAtom, themeModeAtom } from '#V2/atoms/index.js';
import { getContrastTextColor, mixHex } from '#shared/utils/contrast.js';
import { ACCENT_PRIMARY_KEY, appliedTheme, toCompatibilityVars } from '#V2/theme/themes.js';

const THEME_VAR = '--color-theme-brand-surface';
const THEME_FOREGROUND_VAR = '--color-theme-brand-surface-foreground';
const THEME_SEPARATOR_VAR = '--color-theme-brand-surface-separator';
const THEME_HOVER_BG = '--color-theme-brand-surface-hover-bg';
const THEME_HOVER_FG = '--color-theme-brand-surface-hover-fg';
const THEME_ACTIVE_BG = '--color-theme-brand-surface-active-bg';
const THEME_ACTIVE_FG = '--color-theme-brand-surface-active-fg';
const THEME_MODE_STORAGE_KEY = 'uwazi.themeMode';

type ThemeProviderProps = React.PropsWithChildren<{
  className?: string;
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

const ThemeProvider = ({ children, className, style }: ThemeProviderProps) => {
  const settings = useAtomValue(settingsAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const enabled = Boolean(settings.themeCustomization);
  const resolved = appliedTheme(settings.themeVars ?? undefined, themeMode, enabled);
  const topbar = resolved[ACCENT_PRIMARY_KEY] ?? '#1A1A1A';
  const themeVarsStyle: React.CSSProperties & Record<string, string> = {
    ...resolved,
    ...toCompatibilityVars(resolved),
    ...getDerivedThemeVars(topbar),
  };

  React.useEffect(() => {
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
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
  }, [themeMode]);

  return (
    <div
      className={['tw-content', themeMode === 'dark' ? 'dark' : '', className]
        .filter(Boolean)
        .join(' ')}
      data-theme-custom={enabled ? true : undefined}
      data-theme-mode={themeMode}
      style={{ colorScheme: themeMode, ...themeVarsStyle, ...style }}
    >
      {children}
    </div>
  );
};

export { ThemeProvider, getDerivedThemeVars };
