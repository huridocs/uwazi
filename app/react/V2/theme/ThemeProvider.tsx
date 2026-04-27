import React, { useLayoutEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  getEffectiveThemeMode,
  settingsAtom,
  themeControlledModeAtom,
  themeModeAtom,
} from '#V2/atoms/index.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import { appliedTheme, getPresetId, type ThemeMode } from '#V2/theme/themes.js';

type ThemeProviderProps = React.PropsWithChildren<{
  className?: string;
  controlledMode?: ThemeMode;
  style?: React.CSSProperties & Record<string, string>;
  /** Use legacy token preset only; still follows light/dark when customization is on. */
  legacyChrome?: boolean;
}>;

const ThemeProvider = ({
  children,
  className,
  controlledMode,
  style,
  legacyChrome = false,
}: ThemeProviderProps) => {
  const settings = useAtomValue(settingsAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const setThemeControlledMode = useSetAtom(themeControlledModeAtom);
  const themeVars = settings.themeVars ?? undefined;
  const customizationOn = Boolean(settings.themeCustomization);
  const resolutionEnabled = customizationOn && !legacyChrome;
  const effectiveThemeMode = getEffectiveThemeMode(customizationOn, themeMode, controlledMode);

  useLayoutEffect(() => {
    setThemeControlledMode(controlledMode);
  }, [controlledMode, setThemeControlledMode]);

  const presetId = React.useMemo(
    () => (legacyChrome ? 'legacy' : getPresetId(themeVars, customizationOn)),
    [legacyChrome, customizationOn, themeVars]
  );
  const resolved = React.useMemo(
    () => appliedTheme(themeVars, effectiveThemeMode, resolutionEnabled),
    [resolutionEnabled, effectiveThemeMode, themeVars]
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
      data-theme-custom={resolutionEnabled ? true : undefined}
      data-theme-mode={effectiveThemeMode}
      style={{ colorScheme: effectiveThemeMode, ...themeVarsStyle, ...style }}
    >
      {children}
    </div>
  );
};

export { ThemeProvider };
