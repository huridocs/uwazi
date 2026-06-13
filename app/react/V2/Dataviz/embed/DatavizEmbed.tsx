import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { localeAtom, settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import type { DatavizPublicEmbedDTO } from '#shared/types/datavizSchema.js';
import { mapToEChartsOption } from '#V2/Dataviz/rendering/mappers/index.js';
import { filterDataForDisplay } from '#V2/Dataviz/rendering/filterDataForDisplay.js';
import { DatavizChartView } from '#V2/Dataviz/rendering/DatavizChartView.js';
import { DatavizListView } from '#V2/Dataviz/rendering/list/DatavizListView.js';
import { DatavizMetricView } from '#V2/Dataviz/rendering/metric/DatavizMetricView.js';
import { useDatavizEmbedData } from './useDatavizEmbedData.js';

type DatavizEmbedProps = {
  id: string;
  height?: number;
};

const DatavizEmbedContent = ({
  payload,
  height,
}: {
  payload: DatavizPublicEmbedDTO;
  height?: number;
}) => {
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom);
  const settings = useAtomValue(settingsAtom);
  const defaultLocale = settings.languages?.find(language => language.default)?.key ?? locale ?? 'en';

  const colorContext = useMemo(() => {
    const templatesById: Record<string, { color?: string; name?: string }> = {};
    templates.forEach(template => {
      if (template._id) {
        templatesById[template._id] = { color: template.color, name: template.name };
      }
    });
    return { templatesById, sources: payload.sources };
  }, [templates, payload.sources]);

  const displayData = useMemo(
    () => filterDataForDisplay(payload.data, payload.chart, { locale, defaultLocale }),
    [payload.data, payload.chart, locale, defaultLocale]
  );

  const chartOption = useMemo(
    () =>
      mapToEChartsOption(displayData, payload.chart, payload.appearance, {
        ...colorContext,
        locale,
        defaultLocale,
      }),
    [displayData, payload.chart, payload.appearance, colorContext, locale, defaultLocale]
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
    return <DatavizListView data={displayData} />;
  }

  if (isMetricChart) {
    return <DatavizMetricView data={displayData} appearance={payload.appearance} />;
  }

  return (
    <DatavizChartView
      option={chartOption}
      height={height ?? (displayData.series.length > 1 ? 360 : 320)}
    />
  );
};

const DatavizEmbed = ({ id, height }: DatavizEmbedProps) => {
  const { payload, loading, error } = useDatavizEmbedData(id);

  if (loading) {
    return <p className="text-sm text-ink-secondary">Loading visualization…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!payload) {
    return <p className="text-sm text-ink-secondary">No visualization data available.</p>;
  }

  if (payload.data.stale) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-amber-700">Data may be outdated.</p>
        <DatavizEmbedContent payload={payload} height={height} />
      </div>
    );
  }

  return <DatavizEmbedContent payload={payload} height={height} />;
};

export { DatavizEmbed };
