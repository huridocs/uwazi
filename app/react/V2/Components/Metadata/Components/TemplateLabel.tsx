import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { effectiveThemeModeAtom, settingsAtom } from '#V2/atoms/index.js';
import { Translate } from '#app/I18N/index.js';
import { getTemplatePillColors } from '#shared/utils/contrast.js';
import { appliedThemeAsInProvider } from '#V2/theme/themes.js';
import { getTemplatePillThemeAnchors, parseThemeColorHex } from '#V2/theme/templatePillTheme.js';

const TemplateLabel = ({ templateId }: { templateId?: string }) => {
  const templates = useAtomValue(templatesAtom);
  const settings = useAtomValue(settingsAtom);
  const themeMode = useAtomValue(effectiveThemeModeAtom);
  const template = useMemo(
    () => templates.find(t => t._id === templateId),
    [templateId, templates]
  );

  const themeColors = useMemo(
    () =>
      appliedThemeAsInProvider(settings.themeVars ?? undefined, themeMode, {
        customizationOn: Boolean(settings.themeCustomization),
      }),
    [settings.themeCustomization, settings.themeVars, themeMode]
  );

  const { pillStyle, swatchStyle } = useMemo(() => {
    const { tintBase, defaultAccent } = getTemplatePillThemeAnchors(themeColors, themeMode);
    const templateColorHex = template?.color
      ? (parseThemeColorHex(template.color) ?? defaultAccent)
      : defaultAccent;
    const { background, foreground } = getTemplatePillColors(templateColorHex, tintBase);
    return {
      pillStyle: {
        backgroundColor: background,
        color: foreground,
        borderStyle: 'none' as const,
        borderWidth: 0,
        outline: 'none',
      } as const,
      swatchStyle: { backgroundColor: templateColorHex } as const,
    };
  }, [template?.color, themeColors, themeMode]);

  if (!template) {
    return undefined;
  }

  return (
    <span
      className="inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium outline-none"
      style={pillStyle}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-[2px]" style={swatchStyle} aria-hidden="true" />
      <Translate context={template._id}>{template.name}</Translate>
    </span>
  );
};

export { TemplateLabel };
