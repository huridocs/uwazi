import type {
  DataPoint,
  DataSeries,
  DatavizAppearance,
  DatavizDataDTO,
  DimensionSpec,
  LocalizedLabels,
  MeasureSpec,
} from '#shared/types/datavizSchema.js';
import {
  normalizeDatavizBucketKey,
  serializeDatavizBucketKey,
  compareDatavizBucketKeys,
} from '#shared/dataviz/formatDimensionKeyLabel.js';
import { alignCompareBreakdownColumns } from '#shared/dataviz/alignCompareBreakdownColumns.js';
import { DATAVIZ_MAX_BUCKETS } from '#shared/types/datavizSchema.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { MultilingualLabelResolver } from './DatavizMultilingualLabelResolver.js';
import { applyLocalizedPointLabels } from './applyLocalizedPointLabel.js';

type RawBucket = {
  _id:
    | string
    | number
    | null
    | { primary: string | number; secondary: string | number }
    | { from: number; to: number };
  count: number;
};

type LabelResolver = MultilingualLabelResolver;

const sortPoints = (points: DataPoint[], sort?: DimensionSpec['sort']): DataPoint[] => {
  const copy = [...points];
  if (sort === 'key_asc') {
    copy.sort((a, b) => compareDatavizBucketKeys(a.key, b.key));
  } else if (sort === 'label_asc') {
    copy.sort((a, b) =>
      String(a.label).localeCompare(String(b.label), undefined, { numeric: true })
    );
  } else {
    copy.sort((a, b) => b.value - a.value);
  }
  return copy;
};

const applyColors = (points: DataPoint[], appearance?: DatavizAppearance): DataPoint[] => {
  if (!appearance) return points;
  if (appearance.colorMode === 'custom' && appearance.valueColorMap) {
    return points.map(p => ({
      ...p,
      color: appearance.valueColorMap![String(p.key)],
    }));
  }
  return points;
};

const rollupPrimaryValue = (breakdown: DataPoint[], measure?: MeasureSpec): number => {
  if (!breakdown.length) {
    return 0;
  }

  const values = breakdown.map(point => point.value);
  const aggregation = measure?.aggregation ?? 'count';

  if (aggregation === 'count' || !measure?.property) {
    return values.reduce((sum, value) => sum + value, 0);
  }

  if (aggregation === 'sum') {
    return values.reduce((sum, value) => sum + value, 0);
  }

  if (aggregation === 'avg') {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  if (aggregation === 'min') {
    return Math.min(...values);
  }

  return Math.max(...values);
};

const limitBreakdown = (
  breakdown: DataPoint[],
  secondaryDim: DimensionSpec
): { breakdown: DataPoint[]; truncated: boolean } => {
  const secondaryMax = secondaryDim.maxBuckets ?? DATAVIZ_MAX_BUCKETS;
  const sorted = sortPoints(breakdown, secondaryDim.sort);
  if (sorted.length <= secondaryMax) {
    return { breakdown: sorted, truncated: false };
  }
  return { breakdown: sorted.slice(0, secondaryMax), truncated: true };
};

export const normalizeBuckets = (params: {
  buckets: RawBucket[];
  primaryDim: DimensionSpec;
  secondaryDim?: DimensionSpec;
  resolveLabel: LabelResolver;
  datavizId: string;
  queryDurationMs: number;
  appearance?: DatavizAppearance;
  seriesLabel?: string;
  seriesLabels?: LocalizedLabels;
  defaultLanguage: LanguageISO6391;
  missingBucketLabels: LocalizedLabels;
  measure?: MeasureSpec;
}): DatavizDataDTO => {
  const {
    buckets,
    primaryDim,
    secondaryDim,
    resolveLabel,
    datavizId,
    queryDurationMs,
    appearance,
    seriesLabel = 'Series',
    seriesLabels,
    defaultLanguage,
    missingBucketLabels,
    measure,
  } = params;

  const primaryMax = primaryDim.maxBuckets ?? DATAVIZ_MAX_BUCKETS;

  if (!secondaryDim) {
    const totalEntities = buckets.reduce((sum, b) => sum + b.count, 0);
    const truncated = buckets.length >= primaryMax;
    const points: DataPoint[] = buckets.map(b => {
      const key = normalizeDatavizBucketKey(b._id);
      const { label, labels } = applyLocalizedPointLabels(
        key,
        primaryDim,
        resolveLabel,
        defaultLanguage,
        missingBucketLabels
      );
      return {
        key,
        label,
        labels,
        value: b.count,
      };
    });

    const sorted = applyColors(sortPoints(points, primaryDim.sort), appearance);

    return {
      datavizId,
      generatedAt: new Date().toISOString(),
      stale: false,
      meta: { totalEntities, truncated, queryDurationMs },
      series: [
        {
          id: 'main',
          label: seriesLabel,
          labels: seriesLabels,
          points: sorted,
        },
      ],
    };
  }

  const byPrimary = new Map<string | number, Map<string | number, number>>();

  buckets.forEach(b => {
    const id = b._id as { primary: string | number; secondary: string | number };
    const primaryKey = normalizeDatavizBucketKey(id.primary);
    const secondaryKey = normalizeDatavizBucketKey(id.secondary);
    const primaryMapKey = serializeDatavizBucketKey(primaryKey);
    const secondaryMapKey = serializeDatavizBucketKey(secondaryKey);
    if (!byPrimary.has(primaryMapKey)) {
      byPrimary.set(primaryMapKey, new Map());
    }
    byPrimary.get(primaryMapKey)!.set(secondaryMapKey, b.count);
  });

  const allPoints: DataPoint[] = [...byPrimary.entries()].map(([primaryMapKey, secondaryMap]) => {
    const primaryKey = normalizeDatavizBucketKey(primaryMapKey);
    const breakdown: DataPoint[] = [...secondaryMap.entries()].map(([secondaryMapKey, count]) => {
      const secondaryKey = normalizeDatavizBucketKey(secondaryMapKey);
      const { label, labels } = applyLocalizedPointLabels(
        secondaryKey,
        secondaryDim,
        resolveLabel,
        defaultLanguage,
        missingBucketLabels
      );
      return {
        key: secondaryKey,
        label,
        labels,
        value: count,
      };
    });

    const total = rollupPrimaryValue(breakdown, measure);
    const primaryLocalized = applyLocalizedPointLabels(
      primaryKey,
      primaryDim,
      resolveLabel,
      defaultLanguage,
      missingBucketLabels
    );

    return {
      key: primaryKey,
      label: primaryLocalized.label,
      labels: primaryLocalized.labels,
      value: total,
      breakdown,
    };
  });

  const totalEntities = allPoints.reduce((sum, p) => sum + p.value, 0);
  const sortedPrimaries = sortPoints(allPoints, primaryDim.sort);
  let truncated = sortedPrimaries.length > primaryMax;
  const limitedPrimaries = sortedPrimaries.slice(0, primaryMax).map(point => {
    const { breakdown, truncated: secondaryTruncated } = limitBreakdown(
      point.breakdown ?? [],
      secondaryDim
    );
    if (secondaryTruncated) {
      truncated = true;
    }
    return { ...point, breakdown };
  });

  return {
    datavizId,
    generatedAt: new Date().toISOString(),
    stale: false,
    meta: { totalEntities, truncated, queryDurationMs },
    series: [
      {
        id: 'main',
        label: seriesLabel,
        labels: seriesLabels,
        points: applyColors(limitedPrimaries, appearance),
      },
    ],
  };
};

export const normalizeCompareSeries = (params: {
  bucketSets: RawBucket[][];
  sourceIds: string[];
  sourceLabels: string[];
  sourceLocalizedLabels: LocalizedLabels[];
  primaryDim: DimensionSpec;
  secondaryDim?: DimensionSpec;
  resolveLabel: LabelResolver;
  datavizId: string;
  queryDurationMs: number;
  appearance?: DatavizAppearance;
  defaultLanguage: LanguageISO6391;
  missingBucketLabels: LocalizedLabels;
  measure?: MeasureSpec;
}): DatavizDataDTO => {
  const {
    bucketSets,
    sourceIds,
    sourceLabels,
    sourceLocalizedLabels,
    primaryDim,
    secondaryDim,
    resolveLabel,
    datavizId,
    queryDurationMs,
    appearance,
    defaultLanguage,
    missingBucketLabels,
    measure,
  } = params;

  const perSource = bucketSets.map((buckets, index) =>
    normalizeBuckets({
      buckets,
      primaryDim,
      secondaryDim,
      resolveLabel,
      datavizId,
      queryDurationMs: 0,
      appearance,
      seriesLabel: sourceLabels[index] ?? 'Series',
      seriesLabels: sourceLocalizedLabels[index],
      defaultLanguage,
      missingBucketLabels,
      measure,
    })
  );

  const series: DataSeries[] = perSource.map((dto, index) => ({
    id: sourceIds[index] ?? `series-${index}`,
    label: sourceLabels[index] ?? `Series ${index + 1}`,
    labels: sourceLocalizedLabels[index],
    points: dto.series[0]?.points ?? [],
  }));

  const totalEntities = perSource.reduce((sum, dto) => sum + (dto.meta.totalEntities ?? 0), 0);
  const truncated = perSource.some(dto => dto.meta.truncated);

  return alignCompareBreakdownColumns({
    datavizId,
    generatedAt: new Date().toISOString(),
    stale: false,
    meta: { totalEntities, truncated, queryDurationMs },
    series,
  });
};

type CompositeBucketId = { primary: string | number; secondary: string | number };

const isCompositeBucketId = (id: unknown): id is CompositeBucketId =>
  typeof id === 'object' &&
  id !== null &&
  !Array.isArray(id) &&
  'primary' in id &&
  'secondary' in id;

const compositeBucketKey = (id: CompositeBucketId): string => {
  const primaryKey = serializeDatavizBucketKey(normalizeDatavizBucketKey(id.primary));
  const secondaryKey = serializeDatavizBucketKey(normalizeDatavizBucketKey(id.secondary));
  return `${String(primaryKey)}\u0000${String(secondaryKey)}`;
};

const mergeOneDimensionalUnionBuckets = (bucketSets: RawBucket[][]): RawBucket[] => {
  const merged = new Map<string | number, number>();

  bucketSets.forEach(buckets => {
    buckets.forEach(bucket => {
      const key = serializeDatavizBucketKey(bucket._id);
      merged.set(key, (merged.get(key) ?? 0) + bucket.count);
    });
  });

  return [...merged.entries()].map(([key, count]) => ({
    _id: normalizeDatavizBucketKey(key),
    count,
  }));
};

const mergeTwoDimensionalUnionBuckets = (bucketSets: RawBucket[][]): RawBucket[] => {
  const merged = new Map<string, number>();
  const bucketIds = new Map<string, CompositeBucketId>();

  bucketSets.forEach(buckets => {
    buckets.forEach(bucket => {
      if (!isCompositeBucketId(bucket._id)) {
        return;
      }

      const composite = compositeBucketKey(bucket._id);
      merged.set(composite, (merged.get(composite) ?? 0) + bucket.count);
      if (!bucketIds.has(composite)) {
        bucketIds.set(composite, {
          primary: normalizeDatavizBucketKey(bucket._id.primary) as string | number,
          secondary: normalizeDatavizBucketKey(bucket._id.secondary) as string | number,
        });
      }
    });
  });

  return [...merged.entries()].map(([composite, count]) => ({
    _id: bucketIds.get(composite)!,
    count,
  }));
};

export const mergeUnionBuckets = (
  bucketSets: RawBucket[][],
  sourceLabels: string[]
): { buckets: RawBucket[]; seriesLabel: string } => {
  if (bucketSets.length === 1) {
    return { buckets: bucketSets[0]!, seriesLabel: sourceLabels[0] ?? 'Series' };
  }

  const hasCompositeBuckets = bucketSets.some(buckets =>
    buckets.some(bucket => isCompositeBucketId(bucket._id))
  );

  return {
    buckets: hasCompositeBuckets
      ? mergeTwoDimensionalUnionBuckets(bucketSets)
      : mergeOneDimensionalUnionBuckets(bucketSets),
    seriesLabel: 'Union',
  };
};

export type { RawBucket, DataSeries };

export const normalizeMetricCount = (params: {
  counts: number[];
  sourceIds: string[];
  sourceLabels: string[];
  sourceLocalizedLabels?: LocalizedLabels[];
  datavizId: string;
  queryDurationMs: number;
}): DatavizDataDTO => {
  const { counts, sourceIds, sourceLabels, sourceLocalizedLabels, datavizId, queryDurationMs } =
    params;

  const joinType = counts.length > 1 ? 'compare' : 'single';
  const totalEntities = counts.reduce((sum, count) => sum + count, 0);

  if (joinType === 'single') {
    const value = counts[0] ?? 0;
    return {
      datavizId,
      generatedAt: new Date().toISOString(),
      stale: false,
      meta: { totalEntities: value, truncated: false, queryDurationMs },
      series: [
        {
          id: 'total',
          label: sourceLabels[0] ?? 'Total',
          labels: sourceLocalizedLabels?.[0],
          points: [{ key: 'total', label: 'Total', value }],
        },
      ],
    };
  }

  const series: DataSeries[] = counts.map((count, index) => ({
    id: sourceIds[index] ?? `series-${index}`,
    label: sourceLabels[index] ?? `Series ${index + 1}`,
    labels: sourceLocalizedLabels?.[index],
    points: [{ key: 'total', label: 'Total', value: count }],
  }));

  return {
    datavizId,
    generatedAt: new Date().toISOString(),
    stale: false,
    meta: { totalEntities, truncated: false, queryDurationMs },
    series,
  };
};
