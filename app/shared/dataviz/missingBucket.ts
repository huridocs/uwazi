import type { DataPoint, DatavizDataDTO } from '#shared/types/datavizSchema.js';

export const DATAVIZ_MISSING_BUCKET_KEY = '__missing__';

export const DATAVIZ_MISSING_BUCKET_LABEL = 'No data';

export const isDatavizMissingBucketKey = (key: string | number | null | undefined): boolean =>
  key == null || String(key) === DATAVIZ_MISSING_BUCKET_KEY;

export const datavizBucketLabel = (
  key: unknown,
  resolvedLabel: string,
  missingValueLabel: string = DATAVIZ_MISSING_BUCKET_LABEL
): string => {
  if (isDatavizMissingBucketKey(key as string | number | null | undefined) || resolvedLabel === DATAVIZ_MISSING_BUCKET_KEY) {
    return missingValueLabel;
  }
  return resolvedLabel;
};

export const formatDatavizDataPoint = (
  point: DataPoint,
  missingValueLabel?: string
): DataPoint => {
  const label = datavizBucketLabel(point.key, point.label, missingValueLabel);
  if (!point.breakdown) {
    return { ...point, label };
  }
  return {
    ...point,
    label,
    breakdown: point.breakdown.map(item => formatDatavizDataPoint(item, missingValueLabel)),
  };
};

export const formatDatavizDataLabels = (
  dto: DatavizDataDTO,
  missingValueLabel?: string
): DatavizDataDTO => ({
  ...dto,
  series: dto.series.map(series => ({
    ...series,
    points: series.points.map(point => formatDatavizDataPoint(point, missingValueLabel)),
  })),
});
