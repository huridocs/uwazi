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
import { ThemeScopeContext } from '#V2/theme/themeScopeContext.js';

type ThemeStyle = React.CSSProperties & Record<string, string>;

type ThemeProviderProps = React.PropsWithChildren<{
  className?: string;
  controlledMode?: ThemeMode;
  scopedMode?: ThemeMode;
  path?: string;
  style?: ThemeStyle;
  /** Use legacy token preset only; still follows light/dark when customization is on. */
  legacyChrome?: boolean;
}>;

const useSyncThemeAtoms = (controlledMode?: ThemeMode) => {
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const setThemeControlledMode = useSetAtom(themeControlledModeAtom);
  const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;
  useIsomorphicLayoutEffect(() => {
    setThemeControlledMode(controlledMode);
  }, [controlledMode, setThemeControlledMode]);
  useEffect(() => {
    if (controlledMode && themeMode !== controlledMode) {
      setThemeMode(controlledMode);
    }
  }, [controlledMode, setThemeMode, themeMode]);
  return themeMode;
};

const useThemeSurface = ({
  themeVars,
  mode,
  useCustomizationPipeline,
  legacyChrome,
  customizationOn,
  className,
}: {
  themeVars: Record<string, string | undefined> | undefined;
  mode: ThemeMode;
  useCustomizationPipeline: boolean;
  legacyChrome: boolean;
  customizationOn: boolean;
  className?: string;
}) => {
  const presetId = React.useMemo(
    () => (legacyChrome ? 'legacy' : getPresetId(themeVars, customizationOn)),
    [legacyChrome, customizationOn, themeVars]
  );
  const resolved = React.useMemo(
    () => appliedTheme(themeVars, mode, useCustomizationPipeline),
    [useCustomizationPipeline, mode, themeVars]
  );
  const chromeStyle = React.useMemo(
    () => (useCustomizationPipeline ? getChromeStyleOverrides(themeVars, mode) : {}),
    [useCustomizationPipeline, themeVars, mode]
  );
  const themeVarsStyle = React.useMemo<ThemeStyle>(
    () =>
      useCustomizationPipeline
        ? mergeScopedThemeAndChrome(getScopedThemeVars(presetId, resolved), chromeStyle, resolved)
        : getScopedThemeVars(presetId, resolved),
    [useCustomizationPipeline, presetId, resolved, chromeStyle]
  );
  const mergedClassName = React.useMemo(
    () => ['tw-content', mode === 'dark' ? 'dark' : '', className].filter(Boolean).join(' '),
    [className, mode]
  );
  const themeScope = React.useMemo(() => ({ mode, colors: resolved }), [mode, resolved]);
  return { presetId, themeVarsStyle, mergedClassName, themeScope };
};

const ThemeProvider = ({
  children,
  className,
  controlledMode,
  scopedMode,
  path,
  style,
  legacyChrome = false,
}: ThemeProviderProps) => {
  const settings = useAtomValue(settingsAtom);
  const themeMode = useSyncThemeAtoms(controlledMode);
  const customizationOn = Boolean(settings.themeCustomization);
  const useCustomizationPipeline = customizationOn && !legacyChrome;
  const mode = scopedMode ?? getEffectiveThemeMode(customizationOn, themeMode, controlledMode);
  const surface = useThemeSurface({
    themeVars: settings.themeVars ?? undefined,
    mode,
    useCustomizationPipeline,
    legacyChrome,
    customizationOn,
    className,
  });

  return (
    <ThemeScopeContext.Provider value={surface.themeScope}>
      <div
        className={surface.mergedClassName}
        data-path={path}
        data-theme-custom={useCustomizationPipeline ? true : undefined}
        data-theme-mode={mode}
        data-theme-preset={surface.presetId}
        style={{
          colorScheme: mode,
          fontFamily: 'var(--font-theme-sans)',
          ...surface.themeVarsStyle,
          ...style,
        }}
      >
        {children}
      </div>
    </ThemeScopeContext.Provider>
  );
};

export { ThemeProvider };
