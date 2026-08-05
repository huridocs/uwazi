import { computeQueryHash } from '#shared/dataviz/computeQueryHash.js';
import type { DatavizQuery } from '#shared/types/datavizSchema.js';

const baseQuery: DatavizQuery = {
  sources: [{ templateId: 'tpl1' }],
  dimensions: [{ property: 'color', propertyType: 'select' }],
  measures: [{ aggregation: 'count' }],
};

describe('computeQueryHash', () => {
  it('should produce stable hashes for the same query', () => {
    expect(computeQueryHash(baseQuery)).toBe(computeQueryHash({ ...baseQuery }));
  });

  it('should change when query changes', () => {
    const other = {
      ...baseQuery,
      dimensions: [{ property: 'brand', propertyType: 'select' as const }],
    };
    expect(computeQueryHash(baseQuery)).not.toBe(computeQueryHash(other));
  });
});
