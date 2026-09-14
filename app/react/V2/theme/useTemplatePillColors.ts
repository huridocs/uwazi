import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { effectiveThemeModeAtom, settingsAtom } from '#V2/atoms/index.js';
import { appliedThemeAsInProvider } from '#V2/theme/themes.js';
import { getResolvedTemplatePillColors } from '#V2/theme/templatePillTheme.js';

const useTemplatePillColors = (templateColor?: string | null) => {
  const settings = useAtomValue(settingsAtom);
  const themeMode = useAtomValue(effectiveThemeModeAtom);
  const { themeVars, themeCustomization } = settings;
  return useMemo(
    () =>
      getResolvedTemplatePillColors(
        appliedThemeAsInProvider(themeVars ?? undefined, themeMode, {
          customizationOn: Boolean(themeCustomization),
        }),
        themeMode,
        templateColor
      ),
    [themeVars, themeCustomization, themeMode, templateColor]
  );
};

export { useTemplatePillColors };
