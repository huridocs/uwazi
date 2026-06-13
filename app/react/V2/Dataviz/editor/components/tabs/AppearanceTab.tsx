import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/index.js';
import {
  TEMPLATE_DIMENSION_PROPERTY,
  type DatavizDefinition,
} from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import {
  getCustomColorTargetKind,
  getCustomColorTargets,
  supportsCustomColorMode,
} from '#V2/Dataviz/utils/getCustomColorTargets.js';
import { ColorModeSelect } from '../appearance/ColorModeSelect.js';
import { TemplateColorHint } from '../appearance/TemplateColorHint.js';
import { CustomValueColorMapEditor } from '../appearance/CustomValueColorMapEditor.js';
import { ThemeColorsSection } from '../appearance/ThemeColorsSection.js';

type AppearanceTabProps = {
  definition: DatavizDefinition;
  previewData?: DatavizDataDTO | null;
  onPatchAppearance: (patch: Partial<DatavizDefinition['appearance']>) => void;
};

const AppearanceTab = ({ definition, previewData, onPatchAppearance }: AppearanceTabProps) => {
  const { appearance, query, chart } = definition;
  const templates = useAtomValue(templatesAtom);
  const isTemplateDimension =
    query.dimensions[0]?.property === TEMPLATE_DIMENSION_PROPERTY || query.sources.length > 1;

  const colorContext = useMemo(() => {
    const templatesById: Record<string, { color?: string; name?: string }> = {};
    templates.forEach(template => {
      if (template._id) {
        templatesById[template._id] = { color: template.color, name: template.name };
      }
    });
    return { templatesById, sources: query.sources };
  }, [query.sources, templates]);

  const customTargetKind = getCustomColorTargetKind(chart.type, previewData);
  const supportsCustom = supportsCustomColorMode(chart.type, previewData);
  const customTargets = useMemo(
    () => getCustomColorTargets(chart.type, previewData, colorContext),
    [chart.type, colorContext, previewData]
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-ink">Colors</h3>
        <ColorModeSelect
          value={appearance.colorMode}
          supportsCustomColors={supportsCustom}
          customTargetKind={customTargetKind}
          onChange={colorMode => onPatchAppearance({ colorMode })}
        />
        {appearance.colorMode === 'custom' && !supportsCustom && (
          <p className="text-xs text-amber-700">
            Custom colors are not available for this chart type. Use the chart palette or template
            colors instead.
          </p>
        )}
        {appearance.colorMode === 'template' && (
          <TemplateColorHint sources={query.sources} />
        )}
        {(appearance.colorMode === 'template' || appearance.colorMode === 'from_data') &&
          !isTemplateDimension && (
          <p className="text-xs text-amber-700">
            Template colors apply when comparing data sources or when the dimension is entity type.
            Otherwise the chart palette is used as fallback.
          </p>
        )}
        {appearance.colorMode === 'custom' && supportsCustom && (
          <CustomValueColorMapEditor
            targets={customTargets}
            targetKind={customTargetKind}
            valueColorMap={appearance.valueColorMap || {}}
            onChange={valueColorMap => onPatchAppearance({ valueColorMap })}
          />
        )}
      </section>
      <ThemeColorsSection
        background={appearance.themeColors?.background}
        foreground={appearance.themeColors?.foreground}
        onChange={patch =>
          onPatchAppearance({
            themeColors: { ...appearance.themeColors, ...patch },
          })
        }
      />
    </div>
  );
};

export { AppearanceTab };
