import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/index.js';
import type { DatavizDefinition, PreviewTabId } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { mapToEChartsOption } from '#V2/Dataviz/rendering/mappers/index.js';
import { DatavizChartView } from '#V2/Dataviz/rendering/DatavizChartView.js';
import { DatavizListView } from '#V2/Dataviz/rendering/list/DatavizListView.js';
import { DataSummaryTable } from './DataSummaryTable.js';
import { DataInspector } from './DataInspector.js';
import { QueryNormalizedView } from './QueryNormalizedView.js';

const PREVIEW_TABS: { id: PreviewTabId; label: string }[] = [
  { id: 'preview', label: 'Preview' },
  { id: 'inspector', label: 'Data Inspector' },
  { id: 'query', label: 'Query (normalized)' },
];

type DatavizPreviewPanelProps = {
  definition: DatavizDefinition;
  data: DatavizDataDTO | null;
  loading: boolean;
  error: string | null;
  activeTab: PreviewTabId;
  onTabChange: (tab: PreviewTabId) => void;
};

const DatavizPreviewPanel = ({
  definition,
  data,
  loading,
  error,
  activeTab,
  onTabChange,
}: DatavizPreviewPanelProps) => {
  const templates = useAtomValue(templatesAtom);
  const colorContext = useMemo(() => {
    const templatesById: Record<string, { color?: string }> = {};
    templates.forEach(t => {
      if (t._id) templatesById[t._id] = { color: t.color };
    });
    return { templatesById };
  }, [templates]);

  const chartOption = useMemo(() => {
    if (!data) return null;
    return mapToEChartsOption(data, definition.chart, definition.appearance, colorContext);
  }, [data, definition.chart, definition.appearance, colorContext]);

  const isListChart = definition.chart.type === 'list';
  const refreshLabel =
    definition.refresh.refreshMode === 'live'
      ? 'Live'
      : definition.refresh.refreshMode === 'snapshot_manual'
        ? 'Manual snapshot'
        : 'Scheduled';

  return (
    <div className="flex min-h-0 flex-1 flex-col border-l border-border bg-paper">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex gap-1">
          {PREVIEW_TABS.map(tab => (
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
        <span className="rounded-full bg-vellum px-2 py-0.5 text-xs text-ink-secondary">
          {refreshLabel}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {activeTab === 'inspector' && <DataInspector data={data} />}
        {activeTab === 'query' && <QueryNormalizedView query={definition.query} />}

        {activeTab === 'preview' && (
          <div className="flex flex-col gap-4">
            {loading && (
              <p className="text-sm text-ink-secondary">Loading preview…</p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && data && (
              <>
                {isListChart ? (
                  <DatavizListView data={data} />
                ) : (
                  <>
                    <DatavizChartView option={chartOption} height={320} />
                    <DataSummaryTable data={data} />
                  </>
                )}
                {data.meta && (
                  <p className="text-xs text-ink-muted">
                    {data.meta.totalEntities} entities · generated{' '}
                    {new Date(data.generatedAt).toLocaleString()}
                  </p>
                )}
              </>
            )}
            {!loading && !error && !data && (
              <p className="text-sm text-ink-secondary">
                Configure data source and dimension to see a preview.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { DatavizPreviewPanel };
