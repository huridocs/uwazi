import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { settingsAtom, themeModeAtom } from '#V2/atoms/index.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import { appliedTheme, getPresetId, type ThemeMode } from '#V2/theme/themes.js';

type ThemeProviderProps = React.PropsWithChildren<{
  className?: string;
  controlledMode?: ThemeMode;
  style?: React.CSSProperties & Record<string, string>;
}>;

const ThemeProvider = ({ children, className, controlledMode, style }: ThemeProviderProps) => {
  const settings = useAtomValue(settingsAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const themeVars = settings.themeVars ?? undefined;
  const resolvedThemeMode = controlledMode ?? themeMode;
  const enabled = Boolean(settings.themeCustomization);
  const presetId = React.useMemo(() => getPresetId(themeVars, enabled), [enabled, themeVars]);
  const resolved = React.useMemo(
    () => appliedTheme(themeVars, resolvedThemeMode, enabled),
    [enabled, resolvedThemeMode, themeVars]
  );
  const themeVarsStyle = React.useMemo<React.CSSProperties & Record<string, string>>(
    () => getScopedThemeVars(presetId, resolved),
    [presetId, resolved]
  );
  const mergedClassName = React.useMemo(
    () =>
      ['tw-content', resolvedThemeMode === 'dark' ? 'dark' : '', className]
        .filter(Boolean)
        .join(' '),
    [className, resolvedThemeMode]
  );

  React.useEffect(() => {
    if (controlledMode && themeMode !== controlledMode) {
      setThemeMode(controlledMode);
    }
  }, [controlledMode, setThemeMode, themeMode]);

  return (
    <div
      className={mergedClassName}
      data-theme-custom={enabled ? true : undefined}
      data-theme-mode={resolvedThemeMode}
      style={{ colorScheme: resolvedThemeMode, ...themeVarsStyle, ...style }}
    >
      {children}
    </div>
  );
};

export { ThemeProvider };
