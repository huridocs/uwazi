import React, { useMemo, useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { useAtomValue } from 'jotai';
import { CodeEditor } from '#V2/Components/CodeEditor/index.js';
import { localeAtom, settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { JsonCopyPanel } from '../preview/JsonCopyPanel.js';
import { mapToEChartsOption } from '#V2/Dataviz/rendering/mappers/index.js';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { filterDataForDisplay } from '#V2/Dataviz/rendering/filterDataForDisplay.js';

type ChartAdvancedSectionProps = {
  definition: DatavizDefinition;
  previewData: DatavizDataDTO | null;
  onPatchChart: (patch: Partial<DatavizDefinition['chart']>) => void;
};

const stringifyOverrides = (overrides?: Record<string, unknown>) =>
  JSON.stringify(overrides ?? {}, null, 2);

const ChartAdvancedSection = ({
  definition,
  previewData,
  onPatchChart,
}: ChartAdvancedSectionProps) => {
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom);
  const settings = useAtomValue(settingsAtom);
  const defaultLocale =
    settings.languages?.find(language => language.default)?.key ?? locale ?? 'en';
  const [parseError, setParseError] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState(() =>
    stringifyOverrides(definition.chart.echartsOverrides)
  );

  const colorContext = useMemo(() => {
    const templatesById: Record<string, { color?: string; name?: string }> = {};
    templates.forEach(template => {
      if (template._id) {
        templatesById[template._id] = { color: template.color, name: template.name };
      }
    });
    return { templatesById, sources: definition.query.sources };
  }, [templates, definition.query.sources]);

  const resolvedOption = useMemo(() => {
    if (!previewData) {
      return null;
    }
    const displayData = filterDataForDisplay(previewData, definition.chart, {
      locale,
      defaultLocale,
      dimensions: definition.query.dimensions,
      measures: definition.query.measures,
    });
    return mapToEChartsOption(displayData, definition.chart, definition.appearance, {
      ...colorContext,
      dimensions: definition.query.dimensions,
      measures: definition.query.measures,
      locale,
      defaultLocale,
    });
  }, [
    previewData,
    definition.chart,
    definition.appearance,
    definition.query.dimensions,
    definition.query.measures,
    colorContext,
    locale,
    defaultLocale,
  ]);

  const handleEditorChange = (value: string) => {
    setEditorValue(value);
    try {
      const parsed = JSON.parse(value || '{}') as Record<string, unknown>;
      setParseError(null);
      onPatchChart({ echartsOverrides: parsed });
    } catch {
      setParseError('Invalid JSON — overrides not applied until fixed.');
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">
          <Translate>Advanced ECharts overrides</Translate>
        </h3>
        <p className="mt-1 text-xs text-ink-secondary">
          <Translate>
            Deep-merged onto the generated ECharts option. Use for fine-tuning options not exposed
            in the Chart tab.
          </Translate>
        </p>
      </div>
      <div className="h-64 overflow-hidden rounded-lg border border-border">
        <CodeEditor language="json" intialValue={editorValue} onChange={handleEditorChange} />
      </div>
      {parseError && <p className="text-xs text-red-600">{parseError}</p>}
      <JsonCopyPanel
        title="Echarts configuration"
        value={resolvedOption}
        emptyMessage="No configuration"
      />
    </section>
  );
};

export { ChartAdvancedSection };
