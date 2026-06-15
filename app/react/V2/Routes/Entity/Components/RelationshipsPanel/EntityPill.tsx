import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { effectiveThemeModeAtom, settingsAtom } from '#V2/atoms/index.js';
import { getTemplatePillColors, hexToRgb } from '#shared/utils/contrast.js';
import { appliedThemeAsInProvider } from '#V2/theme/themes.js';
import { getTemplatePillThemeAnchors } from '#V2/theme/templatePillTheme.js';

const accentRgba = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
};

type EntityPillProps = {
  templateId: string;
  label: string;
};

const EntityPill = ({ templateId, label }: EntityPillProps) => {
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

  const { tintBase, accentHex } = getTemplatePillThemeAnchors(
    themeColors,
    themeMode,
    template?.color
  );
  const { background, foreground } = getTemplatePillColors(accentHex, tintBase);

  return (
    <span
      title={label}
      className="inline-flex min-w-0 max-w-full items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: background,
        color: foreground,
        border: `1px solid ${accentRgba(accentHex, 0.25)}`,
      }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-[2px]"
        style={{ backgroundColor: accentHex }}
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
    </span>
  );
};

export { EntityPill };
