import React from 'react';
import type { DatavizAppearance } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';

type DatavizMetricViewProps = {
  data: DatavizDataDTO;
  appearance?: DatavizAppearance;
};

const DatavizMetricView = ({ data, appearance }: DatavizMetricViewProps) => {
  const points = data.series[0]?.points ?? [];
  const primary = points[0];
  const value = primary?.value ?? data.meta.totalEntities;

  return (
    <div id={`dataviz-metric-${data.datavizId}`} className="tw-content">
      <div
        className="flex flex-col items-center justify-center rounded-lg p-8"
        style={{
          backgroundColor: appearance?.themeColors?.background ?? 'transparent',
          color: appearance?.themeColors?.foreground,
        }}
      >
        <span className="text-5xl font-semibold tabular-nums">{value.toLocaleString()}</span>
      </div>
    </div>
  );
};

export { DatavizMetricView };
