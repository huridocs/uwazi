import { createHash } from 'crypto';
import type { DatavizQuery } from '#shared/types/datavizSchema.js';

const stableStringify = (value: unknown): string => {
  if (value === null || value === undefined) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

export const computeQueryHash = (query: DatavizQuery): string => {
  const payload = stableStringify({
    sources: query.sources,
    join: query.join,
    filters: query.filters,
    includeUnpublished: query.includeUnpublished,
    dimensions: query.dimensions,
    measures: query.measures,
    language: query.language,
    limit: query.limit,
  });

  return createHash('sha256').update(payload).digest('hex');
};
