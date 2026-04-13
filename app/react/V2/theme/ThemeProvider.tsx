import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { settingsAtom, themeModeAtom } from '#V2/atoms/index.js';
import { getAccessibleColorPair, getContrastTextColor, mixHex } from '#shared/utils/contrast.js';
import { getButtonThemeVars } from '#V2/theme/buttonThemeVars.js';
import {
  getBannerThemeVars,
  getCardThemeVars,
  getControlThemeVars,
  getSurfaceThemeVars,
} from '#V2/theme/surfaceThemeVars.js';
import {
  ACCENT_PRIMARY_KEY,
  appliedTheme,
  getPresetId,
  type ResolvedThemeVars,
  toCompatibilityVars,
  type ThemeMode,
} from '#V2/theme/themes.js';
import {
  EMPHASIS_SOLID_BG,
  EMPHASIS_SOLID_FG,
  THEME_ACTIVE_BG,
  THEME_ACTIVE_FG,
  THEME_FOREGROUND_VAR,
  THEME_HOVER_BG,
  THEME_HOVER_FG,
  THEME_SEPARATOR_VAR,
  THEME_VAR,
} from '#V2/theme/roleTokens.js';

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

const getScopedThemeVars = (
  presetId: ReturnType<typeof getPresetId>,
  resolved: ResolvedThemeVars
): Record<string, string> => {
  const topbar = resolved[ACCENT_PRIMARY_KEY] ?? '#1A1A1A';
  return {
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
};

const ThemeProvider = ({ children, className, controlledMode, style }: ThemeProviderProps) => {
  const settings = useAtomValue(settingsAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const resolvedThemeMode = controlledMode ?? themeMode;
  const enabled = Boolean(settings.themeCustomization);
  const presetId = getPresetId(settings.themeVars ?? undefined, enabled);
  const resolved = appliedTheme(settings.themeVars ?? undefined, resolvedThemeMode, enabled);
  const themeVarsStyle: React.CSSProperties & Record<string, string> = {
    ...getScopedThemeVars(presetId, resolved),
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
  }, [controlledMode, setThemeMode]);

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

export { ThemeProvider, getActionThemeVars, getDerivedThemeVars, getScopedThemeVars };
