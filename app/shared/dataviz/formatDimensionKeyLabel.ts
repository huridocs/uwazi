import type { DimensionSpec } from '#shared/types/datavizSchema.js';
import { DATAVIZ_MISSING_BUCKET_KEY, isDatavizMissingBucketKey } from './missingBucket.js';

export type DatavizDateRangeKey = { from: number; to: number };

export type DatavizBucketKey = string | number | DatavizDateRangeKey;

export const isDatavizDateRangeKey = (key: unknown): key is DatavizDateRangeKey =>
  typeof key === 'object' &&
  key !== null &&
  !Array.isArray(key) &&
  'from' in key &&
  'to' in key &&
  typeof (key as DatavizDateRangeKey).from === 'number' &&
  typeof (key as DatavizDateRangeKey).to === 'number';

const parseSerializedDateRangeKey = (key: string): DatavizDateRangeKey | undefined => {
  if (key.startsWith('dr:')) {
    const [, from, to] = key.split(':');
    if (from !== undefined && to !== undefined) {
      return { from: Number(from), to: Number(to) };
    }
  }

  try {
    const parsed: unknown = JSON.parse(key);
    if (isDatavizDateRangeKey(parsed)) {
      return parsed;
    }
  } catch {
    // not JSON
  }

  return undefined;
};

export const normalizeDatavizBucketKey = (key: unknown): DatavizBucketKey => {
  if (isDatavizMissingBucketKey(key as string | number | null | undefined)) {
    return DATAVIZ_MISSING_BUCKET_KEY;
  }

  if (typeof key === 'string') {
    const parsed = parseSerializedDateRangeKey(key);
    if (parsed) {
      return parsed;
    }
  }

  if (typeof key === 'string' || typeof key === 'number' || isDatavizDateRangeKey(key)) {
    return key;
  }

  return String(key);
};

export const formatDatavizDateLabel = (timestamp: number, locale = 'en-US'): string => {
  if (!timestamp) {
    return '';
  }

  return new Date(timestamp * 1000).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

export const formatDatavizNumericLabel = (value: number): string => {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  const rounded = Math.round(value * 1000) / 1000;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return String(parseFloat(rounded.toFixed(3)));
};

export const formatDatavizDateRangeLabel = (
  range: DatavizDateRangeKey,
  locale = 'en-US'
): string => {
  const from = formatDatavizDateLabel(range.from, locale);
  const to = formatDatavizDateLabel(range.to, locale);
  return `${from} ~ ${to}`.trim();
};

export const formatDatavizDimensionKeyLabel = (
  key: unknown,
  options: {
    propertyType?: DimensionSpec['propertyType'];
    dateInterval?: DimensionSpec['dateInterval'];
    thesaurusLabels?: Map<string, string>;
    locale?: string;
  } = {}
): string => {
  const normalizedKey = normalizeDatavizBucketKey(key);

  if (isDatavizMissingBucketKey(normalizedKey)) {
    return DATAVIZ_MISSING_BUCKET_KEY;
  }

  if (options.propertyType === 'date' || options.propertyType === 'multidate') {
    const interval = options.dateInterval ?? 'year';
    if (interval === 'computed_years' && typeof normalizedKey === 'number') {
      return formatDatavizNumericLabel(normalizedKey);
    }
    if (interval === 'week' && typeof normalizedKey === 'string') {
      return normalizedKey;
    }
    if (interval === 'year' && typeof normalizedKey === 'number') {
      return String(normalizedKey);
    }
    if (interval === 'month' && typeof normalizedKey === 'string') {
      return normalizedKey;
    }
    if (typeof normalizedKey === 'number') {
      return formatDatavizDateLabel(normalizedKey, options.locale);
    }
  }

  if (options.propertyType === 'daterange' || options.propertyType === 'multidaterange') {
    const interval = options.dateInterval ?? 'year';
    if (interval === 'computed_years' && typeof normalizedKey === 'number') {
      return formatDatavizNumericLabel(normalizedKey);
    }
    if (interval === 'week' && typeof normalizedKey === 'string') {
      return normalizedKey;
    }
    if (interval === 'year' && typeof normalizedKey === 'number') {
      return String(normalizedKey);
    }
    if (interval === 'month' && typeof normalizedKey === 'string') {
      return normalizedKey;
    }
    if (typeof normalizedKey === 'number') {
      return formatDatavizDateLabel(normalizedKey, options.locale);
    }
    if (isDatavizDateRangeKey(normalizedKey)) {
      return formatDatavizDateRangeLabel(normalizedKey, options.locale);
    }
  }

  if (typeof normalizedKey === 'string' || typeof normalizedKey === 'number') {
    if (options.propertyType === 'numeric' && typeof normalizedKey === 'number') {
      return formatDatavizNumericLabel(normalizedKey);
    }
    return options.thesaurusLabels?.get(String(normalizedKey)) ?? String(normalizedKey);
  }

  if (isDatavizDateRangeKey(normalizedKey)) {
    return formatDatavizDateRangeLabel(normalizedKey, options.locale);
  }

  return String(normalizedKey);
};

export const compareDatavizBucketKeys = (left: unknown, right: unknown): number => {
  const a = normalizeDatavizBucketKey(left);
  const b = normalizeDatavizBucketKey(right);

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  if (isDatavizDateRangeKey(a) && isDatavizDateRangeKey(b)) {
    return a.from - b.from || a.to - b.to;
  }

  return String(a).localeCompare(String(b), undefined, { numeric: true });
};

export const serializeDatavizBucketKey = (key: unknown): string | number => {
  const normalizedKey = normalizeDatavizBucketKey(key);

  if (typeof normalizedKey === 'string' || typeof normalizedKey === 'number') {
    return normalizedKey;
  }

  if (isDatavizDateRangeKey(normalizedKey)) {
    return `dr:${normalizedKey.from}:${normalizedKey.to}`;
  }

  return String(normalizedKey);
};
