import type { DataPoint, DatavizChartConfig, DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { projectDatavizLabelsForLocale } from '#shared/dataviz/projectDatavizLabelsForLocale.js';
import {
  DATAVIZ_MISSING_BUCKET_KEY,
  datavizBucketLabel,
  formatDatavizDataLabels,
  isDatavizMissingBucketKey,
} from '#shared/dataviz/missingBucket.js';
import { fillBreakdownMatrix } from '#shared/dataviz/fillBreakdownMatrix.js';

type FilterDataForDisplayOptions = {
  locale?: string;
  defaultLocale?: string;
};

const shouldIncludePoint = (point: DataPoint, chart: DatavizChartConfig): boolean => {
  if (!(chart.showMissingValues ?? false) && isDatavizMissingBucketKey(point.key)) {
    return false;
  }
  if (chart.excludeZero && point.value === 0) {
    return false;
  }
  return true;
};

const filterPoints = (points: DataPoint[], chart: DatavizChartConfig): DataPoint[] =>
  points
    .filter(point => shouldIncludePoint(point, chart))
    .map(point => {
      if (!point.breakdown?.length) {
        return point;
      }
      const breakdown = filterPoints(point.breakdown, chart);
      const value = breakdown.reduce((sum, item) => sum + item.value, 0);
      return { ...point, breakdown, value };
    })
    .filter(point => !point.breakdown || point.breakdown.length > 0 || shouldIncludePoint(point, chart));

const filterDataForDisplay = (
  data: DatavizDataDTO,
  chart: DatavizChartConfig,
  options: FilterDataForDisplayOptions = {}
): DatavizDataDTO => {
  const localized =
    options.locale && options.locale.length > 0
      ? projectDatavizLabelsForLocale(
          data,
          options.locale,
          options.defaultLocale ?? options.locale
        )
      : data;
  const labeled = formatDatavizDataLabels(localized, chart.missingValueLabel);
  const series = labeled.series.map(item => ({
    ...item,
    points: filterPoints(fillBreakdownMatrix(item.points), chart),
  }));

  const totalEntities =
    series.reduce(
      (sum, item) => sum + item.points.reduce((pointSum, point) => pointSum + point.value, 0),
      0
    ) ?? 0;

  return {
    ...labeled,
    meta: { ...labeled.meta, totalEntities },
    series,
  };
};

export { filterDataForDisplay, DATAVIZ_MISSING_BUCKET_KEY, datavizBucketLabel };
