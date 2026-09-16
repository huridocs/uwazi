import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { effectiveThemeModeAtom, settingsAtom } from '#V2/atoms/index.js';
import { appliedThemeAsInProvider } from '#V2/theme/themes.js';
import { getResolvedTemplatePillColors } from '#V2/theme/templatePillTheme.js';
import { useThemeScope } from '#V2/theme/themeScopeContext.js';

const useTemplatePillColors = (templateColor?: string | null) => {
  const settings = useAtomValue(settingsAtom);
  const themeMode = useAtomValue(effectiveThemeModeAtom);
  const scope = useThemeScope();
  const { themeVars, themeCustomization } = settings;
  const mode = scope?.mode ?? themeMode;
  return useMemo(
    () =>
      getResolvedTemplatePillColors(
        scope?.colors ??
          appliedThemeAsInProvider(themeVars ?? undefined, mode, {
            customizationOn: Boolean(themeCustomization),
          }),
        mode,
        templateColor
      ),
    [mode, scope?.colors, templateColor, themeCustomization, themeVars]
  );
};

export { useTemplatePillColors };
