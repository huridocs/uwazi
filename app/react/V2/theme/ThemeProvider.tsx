import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { getEffectiveThemeMode, settingsAtom, themeModeAtom } from '#V2/atoms/index.js';
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
  const enabled = Boolean(settings.themeCustomization);
  const effectiveThemeMode = getEffectiveThemeMode(enabled, themeMode, controlledMode);
  const presetId = React.useMemo(() => getPresetId(themeVars, enabled), [enabled, themeVars]);
  const resolved = React.useMemo(
    () => appliedTheme(themeVars, effectiveThemeMode, enabled),
    [enabled, effectiveThemeMode, themeVars]
  );
  const themeVarsStyle = React.useMemo<React.CSSProperties & Record<string, string>>(
    () => getScopedThemeVars(presetId, resolved),
    [presetId, resolved]
  );
  const mergedClassName = React.useMemo(
    () =>
      ['tw-content', effectiveThemeMode === 'dark' ? 'dark' : '', className]
        .filter(Boolean)
        .join(' '),
    [className, effectiveThemeMode]
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
      data-theme-mode={effectiveThemeMode}
      style={{ colorScheme: effectiveThemeMode, ...themeVarsStyle, ...style }}
    >
      {children}
    </div>
  );
};

export { ThemeProvider };
