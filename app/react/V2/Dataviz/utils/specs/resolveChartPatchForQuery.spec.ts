import { resolveChartPatchForQuery } from '../resolveChartPatchForQuery.js';

describe('resolveChartPatchForQuery', () => {
  it('should keep pie when switching to manual data', () => {
    const patch = resolveChartPatchForQuery(
      { type: 'pie' },
      [],
      [{ aggregation: 'count' }],
      'manual'
    );

    expect(patch).toBeNull();
  });

  it('should keep metric when switching to manual data', () => {
    const patch = resolveChartPatchForQuery(
      { type: 'metric' },
      [],
      [{ aggregation: 'count' }],
      'manual'
    );

    expect(patch).toBeNull();
  });

  it('should fall back to metric when switching to query without dimensions', () => {
    const patch = resolveChartPatchForQuery(
      { type: 'pie' },
      [],
      [{ aggregation: 'count' }],
      'query'
    );

    expect(patch).toEqual({ type: 'metric' });
  });

  it('should keep stacked_bar when switching to manual data', () => {
    const patch = resolveChartPatchForQuery(
      { type: 'stacked_bar', stacked: true },
      [],
      [{ aggregation: 'count' }],
      'manual'
    );

    expect(patch).toBeNull();
  });
});
