import type { DataPoint, DataSeries, DatavizDataDTO } from '#shared/types/datavizSchema.js';
import { fillBreakdownMatrix } from './fillBreakdownMatrix.js';
import {
  compareDatavizBucketKeys,
  normalizeDatavizBucketKey,
  serializeDatavizBucketKey,
} from './formatDimensionKeyLabel.js';

const collectSecondaryColumns = (points: DataPoint[]) => {
  const columns = new Map<string, { key: string; label: string }>();

  points.forEach(point => {
    point.breakdown?.forEach(item => {
      const key = String(item.key);
      if (!columns.has(key)) {
        columns.set(key, { key, label: item.label });
      }
    });
  });

  return Array.from(columns.values());
};

const alignPointsToPrimaryCategories = (
  points: DataPoint[],
  categoryOrder: string[],
  categoryLabels: Map<string, string>
): DataPoint[] => {
  const pointsByKey = new Map(
    points.map(point => [String(serializeDatavizBucketKey(point.key)), point])
  );

  return categoryOrder.map(key => {
    const existing = pointsByKey.get(key);
    if (existing) {
      return existing;
    }

    return {
      key: normalizeDatavizBucketKey(key),
      label: categoryLabels.get(key) ?? key,
      value: 0,
      breakdown: [],
    };
  });
};

export const alignCompareBreakdownColumns = (dto: DatavizDataDTO): DatavizDataDTO => {
  if (dto.series.length <= 1) {
    return dto;
  }

  const hasBreakdown = dto.series.some(series =>
    series.points.some(point => point.breakdown && point.breakdown.length > 0)
  );

  if (!hasBreakdown) {
    return dto;
  }

  const categoryOrder: string[] = [];
  const categoryLabels = new Map<string, string>();

  dto.series.forEach(series => {
    series.points.forEach(point => {
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

  const allPoints = dto.series.flatMap(series => series.points);
  const secondaryColumns = collectSecondaryColumns(allPoints);

  const alignedSeries: DataSeries[] = dto.series.map(series => {
    const alignedPoints = alignPointsToPrimaryCategories(
      series.points,
      categoryOrder,
      categoryLabels
    ).map(point => {
      const byKey = new Map((point.breakdown ?? []).map(item => [String(item.key), item]));
      const breakdown = secondaryColumns.map(column => {
        const existing = byKey.get(column.key);
        if (existing) {
          return existing;
        }
        return {
          key: column.key,
          label: column.label,
          value: 0,
        };
      });
      const value = breakdown.reduce((sum, item) => sum + item.value, 0);

      return {
        ...point,
        breakdown,
        value,
      };
    });

    return {
      ...series,
      points: fillBreakdownMatrix(alignedPoints),
    };
  });

  return {
    ...dto,
    series: alignedSeries,
  };
};
