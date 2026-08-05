import type { DatavizQuery } from '#V2/Dataviz/types/definition.js';
import {
  getRefreshModeConstraints,
  REFRESH_LIVE_MAX_ENTITIES,
  REFRESH_LIVE_SLOW_QUERY_MS,
} from '../refreshModeConstraints.js';

const baseQuery: DatavizQuery = {
  sources: [{ templateId: 'tpl_cars' }],
  dimensions: [{ property: 'colors', propertyType: 'select' }],
  measures: [{ aggregation: 'count' }],
};

describe('getRefreshModeConstraints', () => {
  it('allows live for a simple single-source query without preview data', () => {
    const result = getRefreshModeConstraints({ query: baseQuery });

    expect(result.liveAllowed).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('blocks live for relationship joins', () => {
    const result = getRefreshModeConstraints({
      query: {
        ...baseQuery,
        join: { type: 'relationship', relationshipProperty: 'owner' },
      },
    });

    expect(result.liveAllowed).toBe(false);
    expect(result.reasons).toContain('RELATIONSHIP_JOIN');
  });

  it('blocks live for multiple sources', () => {
    const result = getRefreshModeConstraints({
      query: {
        ...baseQuery,
        sources: [{ templateId: 'a' }, { templateId: 'b' }],
      },
    });

    expect(result.liveAllowed).toBe(false);
    expect(result.reasons).toContain('MULTI_SOURCE');
  });

  it('blocks live for two dimensions', () => {
    const result = getRefreshModeConstraints({
      query: {
        ...baseQuery,
        dimensions: [
          { property: 'colors', propertyType: 'select' },
          { property: 'year', propertyType: 'date', bucketStrategy: 'date_histogram' },
        ],
      },
    });

    expect(result.liveAllowed).toBe(false);
    expect(result.reasons).toContain('MULTI_DIMENSION');
  });

  it('blocks live when entity count exceeds the threshold', () => {
    const result = getRefreshModeConstraints({
      query: baseQuery,
      previewMeta: { totalEntities: REFRESH_LIVE_MAX_ENTITIES + 1, truncated: false },
    });

    expect(result.liveAllowed).toBe(false);
    expect(result.reasons).toContain('HIGH_ENTITY_COUNT');
  });

  it('blocks live when preview results are truncated', () => {
    const result = getRefreshModeConstraints({
      query: baseQuery,
      previewMeta: { totalEntities: 100, truncated: true },
    });

    expect(result.liveAllowed).toBe(false);
    expect(result.reasons).toContain('TRUNCATED_RESULTS');
  });

  it('blocks live when preview query duration is slow', () => {
    const result = getRefreshModeConstraints({
      query: baseQuery,
      previewQueryDurationMs: REFRESH_LIVE_SLOW_QUERY_MS,
    });

    expect(result.liveAllowed).toBe(false);
    expect(result.reasons).toContain('SLOW_QUERY');
  });

  it('blocks live on timeout errors from preview', () => {
    const result = getRefreshModeConstraints({
      query: baseQuery,
      previewError: 'DATAVIZ_QUERY_TIMEOUT: query exceeded 30s',
    });

    expect(result.liveAllowed).toBe(false);
    expect(result.reasons).toContain('QUERY_TIMEOUT');
  });

  it('does not block live on unrelated preview errors', () => {
    const result = getRefreshModeConstraints({
      query: baseQuery,
      previewError: 'Network error',
    });

    expect(result.liveAllowed).toBe(true);
  });

  it('accumulates multiple block reasons', () => {
    const result = getRefreshModeConstraints({
      query: {
        ...baseQuery,
        sources: [{ templateId: 'a' }, { templateId: 'b' }],
        dimensions: [
          { property: 'colors', propertyType: 'select' },
          { property: 'brand', propertyType: 'select' },
        ],
      },
    });

    expect(result.liveAllowed).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining(['MULTI_SOURCE', 'MULTI_DIMENSION']));
    expect(result.messages.length).toBe(result.reasons.length);
  });
});
