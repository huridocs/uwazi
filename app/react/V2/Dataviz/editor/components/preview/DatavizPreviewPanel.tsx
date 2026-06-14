import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { localeAtom, settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import type { DatavizDefinition, PreviewTabId } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { mapToEChartsOption } from '#V2/Dataviz/rendering/mappers/index.js';
import { filterDataForDisplay } from '#V2/Dataviz/rendering/filterDataForDisplay.js';
import { DatavizChartView } from '#V2/Dataviz/rendering/DatavizChartView.js';
import { DatavizListView } from '#V2/Dataviz/rendering/list/DatavizListView.js';
import { DatavizMetricView } from '#V2/Dataviz/rendering/metric/DatavizMetricView.js';
import { DataSummaryTable } from './DataSummaryTable.js';
import { DataInspector } from './DataInspector.js';
import { QueryNormalizedView } from './QueryNormalizedView.js';
import { ChartAdvancedSection } from '../tabs/ChartAdvancedSection.js';
import { DatavizLoadingIndicator } from '#V2/Dataviz/components/DatavizLoadingIndicator.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';
import { isEchartsChartType } from '#V2/Dataviz/types/chartTypes.js';

const PREVIEW_TABS: { id: PreviewTabId; label: string }[] = [
  { id: 'preview', label: 'Preview' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'inspector', label: 'Data' },
  { id: 'query', label: 'Query' },
];

type DatavizPreviewPanelProps = {
  definition: DatavizDefinition;
  data: DatavizDataDTO | null;
  loading: boolean;
  error: string | null;
  activeTab: PreviewTabId;
  onTabChange: (tab: PreviewTabId) => void;
  onPatchChart: (patch: Partial<DatavizDefinition['chart']>) => void;
};

const DatavizPreviewPanel = ({
  definition,
  data,
  loading,
  error,
  activeTab,
  onTabChange,
  onPatchChart,
}: DatavizPreviewPanelProps) => {
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom);
  const settings = useAtomValue(settingsAtom);
  const defaultLocale = settings.languages?.find(language => language.default)?.key ?? locale ?? 'en';

  const colorContext = useMemo(() => {
    const templatesById: Record<string, { color?: string; name?: string }> = {};
    const templatePropertiesById: Record<string, Array<{ name: string; label: string }>> = {};
    templates.forEach(t => {
      if (t._id) {
        templatesById[t._id] = { color: t.color, name: t.name };
        templatePropertiesById[t._id] = [
          ...(t.commonProperties || []),
          ...(t.properties || []),
        ].map(prop => ({ name: prop.name, label: prop.label }));
      }
    });
    return {
      templatesById,
      templatePropertiesById,
      sources: definition.query.sources,
      dimensions: definition.query.dimensions,
    };
  }, [templates, definition.query.sources, definition.query.dimensions]);

  const displayData = useMemo(
    () =>
      data
        ? filterDataForDisplay(data, definition.chart, { locale, defaultLocale })
        : null,
    [data, definition.chart, locale, defaultLocale]
  );

  const chartOption = useMemo(() => {
    if (!displayData) return null;
    return mapToEChartsOption(displayData, definition.chart, definition.appearance, {
      ...colorContext,
      locale,
      defaultLocale,
    });
  }, [displayData, definition.chart, definition.appearance, colorContext, locale, defaultLocale]);

  const isManual = isManualDataSource(definition.dataSource);
  const usesEcharts = isEchartsChartType(definition.chart.type);
  const visiblePreviewTabs = PREVIEW_TABS.filter(tab => {
    if (tab.id === 'query' && isManual) {
      return false;
    }
    if (tab.id === 'advanced' && !usesEcharts) {
      return false;
    }
    return true;
  });
  const isListChart = definition.chart.type === 'list';
  const isMetricChart = definition.chart.type === 'metric';
  const canRenderChart = isListChart || isMetricChart || chartOption !== null;
  const refreshLabel =
    definition.refresh.refreshMode === 'live'
      ? 'Live'
      : definition.refresh.refreshMode === 'snapshot_manual'
        ? 'Manual snapshot'
        : 'Scheduled';

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-paper">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-paper px-4 py-2">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
          {visiblePreviewTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                activeTab === tab.id
                  ? 'bg-warm font-medium text-ink'
                  : 'text-ink-secondary hover:bg-vellum hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {!isManual && (
          <span className="shrink-0 rounded-full bg-vellum px-2 py-0.5 text-xs text-ink-secondary">
            {refreshLabel}
          </span>
        )}
        {isManual && (
          <span className="shrink-0 rounded-full bg-vellum px-2 py-0.5 text-xs text-ink-secondary">
            Manual data
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {activeTab === 'advanced' && (
          <ChartAdvancedSection
            definition={definition}
            previewData={data}
            onPatchChart={onPatchChart}
          />
        )}
        {activeTab === 'inspector' && <DataInspector data={data} />}
        {activeTab === 'query' && <QueryNormalizedView query={definition.query} />}

        {activeTab === 'preview' && (
          <div className="flex flex-col gap-4">
            {loading && <DatavizLoadingIndicator centered />}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && displayData && (
              <>
                {canRenderChart ? (
                  <>
                    {isListChart ? (
                      <DatavizListView data={displayData} />
                    ) : isMetricChart ? (
                      <DatavizMetricView data={displayData} appearance={definition.appearance} />
                    ) : (
                      <>
                        <DatavizChartView
                          option={chartOption}
                          height={displayData.series.length > 1 ? 360 : 320}
                        />
                        <DataSummaryTable data={displayData} />
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-ink-secondary">
                    This chart type cannot display the current data. Pick a supported type in the
                    Chart tab.
                  </p>
                )}
                {displayData.meta && (
                  <p className="text-xs text-ink-muted">
                    {displayData.meta.totalEntities} entities · generated{' '}
                    {new Date(displayData.generatedAt).toLocaleString()}
                  </p>
                )}
              </>
            )}
            {!loading && !error && !data && (
              <p className="text-sm text-ink-secondary">
                {isManual
                  ? 'Enter valid manual data JSON to see a preview.'
                  : 'Configure data source and dimension to see a preview.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { DatavizPreviewPanel };
