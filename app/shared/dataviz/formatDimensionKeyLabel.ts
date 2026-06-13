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
    thesaurusLabels?: Map<string, string>;
    locale?: string;
  } = {}
): string => {
  const normalizedKey = normalizeDatavizBucketKey(key);

  if (isDatavizMissingBucketKey(normalizedKey)) {
    return DATAVIZ_MISSING_BUCKET_KEY;
  }

  if (options.propertyType === 'date' || options.propertyType === 'multidate') {
    if (typeof normalizedKey === 'number') {
      return formatDatavizDateLabel(normalizedKey, options.locale);
    }
  }

  if (options.propertyType === 'daterange' || options.propertyType === 'multidaterange') {
    if (isDatavizDateRangeKey(normalizedKey)) {
      return formatDatavizDateRangeLabel(normalizedKey, options.locale);
    }
  }

  if (typeof normalizedKey === 'string' || typeof normalizedKey === 'number') {
    return options.thesaurusLabels?.get(String(normalizedKey)) ?? String(normalizedKey);
  }

  if (isDatavizDateRangeKey(normalizedKey)) {
    return formatDatavizDateRangeLabel(normalizedKey, options.locale);
  }

  return String(normalizedKey);
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
