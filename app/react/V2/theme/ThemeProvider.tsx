import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { settingsAtom, themeModeAtom } from '#V2/atoms/index.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import { appliedTheme, getPresetId, type ThemeMode } from '#V2/theme/themes.js';

const THEME_MODE_STORAGE_KEY = 'uwazi.themeMode';

type ThemeProviderProps = React.PropsWithChildren<{
  className?: string;
  controlledMode?: ThemeMode;
  style?: React.CSSProperties & Record<string, string>;
}>;

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

export { ThemeProvider };
