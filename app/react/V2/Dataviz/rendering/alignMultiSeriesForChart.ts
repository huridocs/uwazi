import type { DatavizDataDTO } from '#shared/types/datavizSchema.js';
import {
  normalizeDatavizBucketKey,
  serializeDatavizBucketKey,
  compareDatavizBucketKeys,
} from '#shared/dataviz/formatDimensionKeyLabel.js';

export type AlignedChartSeries = {
  id: string;
  label: string;
  values: number[];
};

export type AlignedMultiSeriesChart = {
  categories: string[];
  series: AlignedChartSeries[];
};

export const alignMultiSeriesForChart = (dto: DatavizDataDTO): AlignedMultiSeriesChart => {
  const categoryOrder: string[] = [];
  const categoryLabels = new Map<string, string>();

  dto.series.forEach(item => {
    item.points.forEach(point => {
      const serializedKey = String(serializeDatavizBucketKey(point.key));
      if (!categoryLabels.has(serializedKey)) {
        categoryOrder.push(serializedKey);
        categoryLabels.set(serializedKey, point.label);
      }
    });
  });

  categoryOrder.sort((left, right) =>
    compareDatavizBucketKeys(normalizeDatavizBucketKey(left), normalizeDatavizBucketKey(right))
  );

  const series = dto.series.map(item => {
    const valuesByKey = new Map(
      item.points.map(point => [String(serializeDatavizBucketKey(point.key)), point.value])
    );

    return {
      id: item.id,
      label: item.label,
      values: categoryOrder.map(key => valuesByKey.get(key) ?? 0),
    };
  });

  return {
    categories: categoryOrder.map(key => categoryLabels.get(key) ?? key),
    series,
  };
};

export const isMultiSeriesCompare = (dto: DatavizDataDTO): boolean => dto.series.length > 1;

export const serializeCategoryKey = (key: unknown): string =>
  String(serializeDatavizBucketKey(normalizeDatavizBucketKey(key)));
