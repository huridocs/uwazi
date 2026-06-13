import React, { useMemo } from 'react';
import type { DatavizEmbedPayload } from '#shared/types/datavizSchema.js';
import { mapToEChartsOption } from '#V2/Dataviz/rendering/mappers/index.js';
import { DatavizChartView } from '#V2/Dataviz/rendering/DatavizChartView.js';
import { DatavizListView } from '#V2/Dataviz/rendering/list/DatavizListView.js';
import { DatavizMetricView } from '#V2/Dataviz/rendering/metric/DatavizMetricView.js';

type DatavizEmbedProps = {
  payload: DatavizEmbedPayload;
  height?: number;
};

const DatavizEmbed = ({ payload, height }: DatavizEmbedProps) => {
  const chartOption = useMemo(
    () => mapToEChartsOption(payload.data, payload.chart, payload.appearance),
    [payload.data, payload.chart, payload.appearance]
  );

  const isListChart = payload.chart.type === 'list';
  const isMetricChart = payload.chart.type === 'metric';
  const canRenderChart = isListChart || isMetricChart || chartOption !== null;

  if (!canRenderChart) {
    return (
      <p className="text-sm text-ink-secondary">
        This chart type cannot display the current data.
      </p>
    );
  }

  if (isListChart) {
    return <DatavizListView data={payload.data} />;
  }

  if (isMetricChart) {
    return <DatavizMetricView data={payload.data} appearance={payload.appearance} />;
  }

  const chartBody = (
    <DatavizChartView
      option={chartOption}
      height={height ?? (payload.data.series.length > 1 ? 360 : 320)}
    />
  );

  if (payload.data.stale) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-amber-700">Data may be outdated.</p>
        {chartBody}
      </div>
    );
  }

  return chartBody;
};

export { DatavizEmbed };
