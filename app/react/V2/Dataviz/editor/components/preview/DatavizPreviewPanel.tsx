import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { localeAtom, settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { Tabs } from '#V2/Components/UI/index.js';
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

type DatavizPreviewPanelProps = {
  definition: DatavizDefinition;
  data: DatavizDataDTO | null;
  loading: boolean;
  error: string | null;
  activeTab: PreviewTabId;
  onTabChange: (tab: PreviewTabId) => void;
  onPatchChart: (patch: Partial<DatavizDefinition['chart']>) => void;
};

type PreviewTabContentProps = {
  definition: DatavizDefinition;
  data: DatavizDataDTO | null;
  loading: boolean;
  error: string | null;
  displayData: DatavizDataDTO | null;
  chartOption: ReturnType<typeof mapToEChartsOption>;
  isManual: boolean;
};

const PreviewTabContent = ({
  definition,
  data,
  loading,
  error,
  displayData,
  chartOption,
  isManual,
}: PreviewTabContentProps) => {
  const isListChart = definition.chart.type === 'list';
  const isMetricChart = definition.chart.type === 'metric';
  const canRenderChart = isListChart || isMetricChart || chartOption !== null;

  return (
    <div className="flex flex-col gap-4 p-4">
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
              This chart type cannot display the current data. Pick a supported type in the Chart
              tab.
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
  );
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
  const defaultLocale =
    settings.languages?.find(language => language.default)?.key ?? locale ?? 'en';

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
        ? filterDataForDisplay(data, definition.chart, {
            locale,
            defaultLocale,
            dimensions: definition.query.dimensions,
            measures: definition.query.measures,
          })
        : null,
    [data, definition.chart, definition.query.dimensions, definition.query.measures, locale, defaultLocale]
  );

  const chartOption = useMemo(() => {
    if (!displayData) return null;
    return mapToEChartsOption(displayData, definition.chart, definition.appearance, {
      ...colorContext,
      measures: definition.query.measures,
      locale,
      defaultLocale,
    });
  }, [
    displayData,
    definition.chart,
    definition.appearance,
    definition.query.measures,
    colorContext,
    locale,
    defaultLocale,
  ]);

  const isManual = isManualDataSource(definition.dataSource);
  const usesEcharts = isEchartsChartType(definition.chart.type);
  const refreshLabel =
    definition.refresh.refreshMode === 'live'
      ? 'Live'
      : definition.refresh.refreshMode === 'snapshot_manual'
        ? 'Manual snapshot'
        : 'Scheduled';

  const tabElements = useMemo(() => {
    const tabs = [
      <Tabs.Tab key="preview" id="preview" label="Preview">
        <PreviewTabContent
          definition={definition}
          data={data}
          loading={loading}
          error={error}
          displayData={displayData}
          chartOption={chartOption}
          isManual={isManual}
        />
      </Tabs.Tab>,
    ];

    if (usesEcharts) {
      tabs.push(
        <Tabs.Tab key="advanced" id="advanced" label="Advanced">
          <div className="p-4">
            <ChartAdvancedSection
              definition={definition}
              previewData={data}
              onPatchChart={onPatchChart}
            />
          </div>
        </Tabs.Tab>
      );
    }

    tabs.push(
      <Tabs.Tab key="inspector" id="inspector" label="Data">
        <div className="p-4">
          <DataInspector data={data} />
        </div>
      </Tabs.Tab>
    );

    if (!isManual) {
      tabs.push(
        <Tabs.Tab key="query" id="query" label="Query">
          <div className="p-4">
            <QueryNormalizedView query={definition.query} />
          </div>
        </Tabs.Tab>
      );
    }

    return tabs;
  }, [
    chartOption,
    data,
    definition,
    displayData,
    error,
    isManual,
    loading,
    onPatchChart,
    usesEcharts,
  ]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-paper">
      <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-vellum px-2 py-0.5 text-xs text-ink-secondary">
        {isManual ? 'Manual data' : refreshLabel}
      </span>
      <Tabs
        unmountTabs={false}
        groupId="dataviz-preview"
        activeTabId={activeTab}
        onTabSelected={tabId => onTabChange(tabId as PreviewTabId)}
        tabListAriaLabel="Dataviz preview"
        tabListClassName="!mx-3 !mt-3 !mb-0 !mr-28"
        className="min-h-0 flex-1"
      >
        {tabElements}
      </Tabs>
    </div>
  );
};

export { DatavizPreviewPanel };
