import React from 'react';
import {
  TEMPLATE_DIMENSION_PROPERTY,
  type DatavizDefinition,
} from '#V2/Dataviz/types/definition.js';
import type { DataPoint } from '#V2/Dataviz/types/data.js';
import { ColorModeSelect } from '../appearance/ColorModeSelect.js';
import { FromDataColorHint } from '../appearance/FromDataColorHint.js';
import { TemplateColorHint } from '../appearance/TemplateColorHint.js';
import { CustomValueColorMapEditor } from '../appearance/CustomValueColorMapEditor.js';
import { ThemeColorsSection } from '../appearance/ThemeColorsSection.js';

type AppearanceTabProps = {
  definition: DatavizDefinition;
  previewPoints?: DataPoint[];
  onPatchAppearance: (patch: Partial<DatavizDefinition['appearance']>) => void;
};

const AppearanceTab = ({ definition, previewPoints, onPatchAppearance }: AppearanceTabProps) => {
  const { appearance, query } = definition;
  const isTemplateDimension =
    query.dimensions[0]?.property === TEMPLATE_DIMENSION_PROPERTY || query.sources.length > 1;

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-ink">Colors</h3>
        <ColorModeSelect
          value={appearance.colorMode}
          onChange={colorMode => onPatchAppearance({ colorMode })}
        />
        {appearance.colorMode === 'from_data' && (
          <FromDataColorHint previewPoints={previewPoints} />
        )}
        {appearance.colorMode === 'template' && (
          <TemplateColorHint sources={query.sources} />
        )}
        {appearance.colorMode === 'template' && !isTemplateDimension && (
          <p className="text-xs text-amber-700">
            Template colors apply when the dimension is entity type or buckets are templates.
          </p>
        )}
        {appearance.colorMode === 'custom' && (
          <CustomValueColorMapEditor
            previewPoints={previewPoints}
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
