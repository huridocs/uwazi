import type { DataPoint, DataSeries, DatavizDataDTO } from '#shared/types/datavizSchema.js';
import {
  compareDatavizBucketKeys,
  serializeDatavizBucketKey,
} from '#shared/dataviz/formatDimensionKeyLabel.js';
import { isMultiSeriesCompare } from './alignMultiSeriesForChart.js';

export type SecondaryColumn = {
  key: string;
  label: string;
  sample?: DataPoint;
};

export const hasNumericBreakdown = (dto: DatavizDataDTO): boolean =>
  dto.series.some(series =>
    series.points.some(point =>
      point.breakdown?.some(item => {
        const value = Number(item.key);
        return Number.isFinite(value) && typeof item.key === 'number';
      })
    )
  );

export const hasCategoricalBreakdown = (dto: DatavizDataDTO): boolean =>
  dto.series.some(series => series.points.some(point => (point.breakdown?.length ?? 0) > 0)) &&
  !hasNumericBreakdown(dto);

export const isCompareBreakdownChart = (dto: DatavizDataDTO): boolean =>
  isMultiSeriesCompare(dto) &&
  dto.series.some(series => series.points.some(point => (point.breakdown?.length ?? 0) > 0));

export const sortPointsChronologically = (points: DataPoint[]): DataPoint[] =>
  [...points].sort((left, right) => compareDatavizBucketKeys(left.key, right.key));

export const alignPointsToChronologicalCategories = (
  referencePoints: DataPoint[],
  points: DataPoint[]
): DataPoint[] => {
  const pointsByKey = new Map(
    points.map(point => [String(serializeDatavizBucketKey(point.key)), point])
  );

  return referencePoints.map(reference => {
    const match = pointsByKey.get(String(serializeDatavizBucketKey(reference.key)));
    return (
      match ?? {
        key: reference.key,
        label: reference.label,
        value: 0,
        breakdown: [],
      }
    );
  });
};

export const collectSecondaryColumns = (seriesList: DataSeries[]): SecondaryColumn[] => {
  const columns = new Map<string, SecondaryColumn>();

  seriesList.forEach(series => {
    series.points.forEach(point => {
      point.breakdown?.forEach(item => {
        const key = String(item.key);
        if (!columns.has(key)) {
          columns.set(key, { key, label: item.label, sample: item });
        }
      });
    });
  });

  return Array.from(columns.values());
};

export const getPrimaryCategories = (seriesList: DataSeries[]): string[] => {
  const firstSeries = seriesList[0];
  if (!firstSeries?.points.length) {
    return [];
  }

  return firstSeries.points.map(point => point.label);
};

export const resolveCompareBreakdownSegmentValue = (
  match: DataPoint | undefined,
  excludeZero?: boolean
): number | string => {
  if (!match) {
    return excludeZero ? '-' : 0;
  }
  if (excludeZero && match.value === 0) {
    return '-';
  }
  return match.value;
};
