import React, { useMemo } from 'react';
import { Translate } from '#app/I18N/index.js';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

type DatavizChartViewProps = {
  option: EChartsOption | null;
  height?: number | string;
  className?: string;
  /** When true, merge new options so ECharts animates data transitions (e.g. live filters). */
  animateUpdates?: boolean;
};

const DatavizChartView = ({
  option,
  height = 320,
  className,
  animateUpdates = false,
}: DatavizChartViewProps) => {
  const style = useMemo(() => ({ height, width: '100%' }), [height]);

  if (!option) {
    return (
      <div
        className={`flex items-center justify-center text-sm text-ink-secondary ${className || ''}`}
        style={style}
      >
        <Translate>Chart type uses a custom view</Translate>
      </div>
    );
  }

  return (
    <ReactECharts
      className={className}
      option={option}
      style={style}
      notMerge={!animateUpdates}
      replaceMerge={animateUpdates ? undefined : ['visualMap', 'series']}
      lazyUpdate={!animateUpdates}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export { DatavizChartView };
