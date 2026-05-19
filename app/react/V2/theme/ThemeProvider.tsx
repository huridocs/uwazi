import React, { useEffect, useLayoutEffect } from 'react';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  getEffectiveThemeMode,
  settingsAtom,
  themeControlledModeAtom,
  themeModeAtom,
} from '#V2/atoms/index.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import {
  appliedTheme,
  getChromeStyleOverrides,
  getPresetId,
  mergeScopedThemeAndChrome,
  type ThemeMode,
} from '#V2/theme/themes.js';

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
  const useCustomizationPipeline = customizationOn && !legacyChrome;
  const effectiveThemeMode = getEffectiveThemeMode(customizationOn, themeMode, controlledMode);

  const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;
  useIsomorphicLayoutEffect(() => {
    setThemeControlledMode(controlledMode);
  }, [controlledMode, setThemeControlledMode]);

  const presetId = React.useMemo(
    () => (legacyChrome ? 'legacy' : getPresetId(themeVars, customizationOn)),
    [legacyChrome, customizationOn, themeVars]
  );
  const resolved = React.useMemo(
    () => appliedTheme(themeVars, effectiveThemeMode, useCustomizationPipeline),
    [useCustomizationPipeline, effectiveThemeMode, themeVars]
  );
  const chromeStyle = React.useMemo(
    () => (useCustomizationPipeline ? getChromeStyleOverrides(themeVars, effectiveThemeMode) : {}),
    [useCustomizationPipeline, themeVars, effectiveThemeMode]
  );
  const themeVarsStyle = React.useMemo<React.CSSProperties & Record<string, string>>(
    () =>
      useCustomizationPipeline
        ? mergeScopedThemeAndChrome(getScopedThemeVars(presetId, resolved), chromeStyle, resolved)
        : getScopedThemeVars(presetId, resolved),
    [useCustomizationPipeline, presetId, resolved, chromeStyle]
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
      data-theme-custom={useCustomizationPipeline ? true : undefined}
      data-theme-mode={effectiveThemeMode}
      style={{
        colorScheme: effectiveThemeMode,
        fontFamily: 'var(--font-theme-sans)',
        ...themeVarsStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export { ThemeProvider };
