import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { effectiveThemeModeAtom, settingsAtom } from '#V2/atoms/index.js';
import { Translate } from '#app/I18N/index.js';
import { getTemplatePillColors, hexToRgb } from '#shared/utils/contrast.js';
import { appliedThemeAsInProvider } from '#V2/theme/themes.js';
import { getTemplatePillThemeAnchors } from '#V2/theme/templatePillTheme.js';

const accentRgba = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
};

type TemplateLabelProps = {
  templateId?: string;
  variant?: 'pill' | 'tag';
};

const TemplateLabel = ({ templateId, variant = 'pill' }: TemplateLabelProps) => {
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
    [settings, themeMode]
  );

  if (!template) {
    return undefined;
  }

  const { tintBase, accentHex } = getTemplatePillThemeAnchors(
    themeColors,
    themeMode,
    template.color
  );
  const swatchStyle = { backgroundColor: accentHex } as const;

  if (variant === 'tag') {
    return (
      <span title={template.name} className="inline-flex max-w-full min-w-0 items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-[2px]" style={swatchStyle} aria-hidden="true" />
        <span className="truncate text-nano font-semibold uppercase tracking-[0.08em] text-ink-tertiary">
          <Translate context={template._id}>{template.name}</Translate>
        </span>
      </span>
    );
  }

  const { background, foreground } = getTemplatePillColors(accentHex, tintBase);
  const pillStyle = {
    backgroundColor: background,
    color: foreground,
    outline: 'none',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: accentRgba(accentHex, 0.25),
  } as const;

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
