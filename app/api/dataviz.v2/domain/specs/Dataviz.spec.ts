import { Dataviz } from '../Dataviz.js';
import { DatavizInvalidQueryError, DatavizLiveNotAllowedError } from '../errors.js';

const validBase = {
  id: 'dv_1',
  name: 'Cars by color',
  query: {
    sources: [{ templateId: '507f1f77bcf86cd799439011' }],
    dimensions: [{ property: 'color', propertyType: 'select' as const }],
    measures: [{ aggregation: 'count' as const }],
  },
  chart: { type: 'pie' as const },
  appearance: { colorMode: 'from_data' as const },
  refresh: { refreshMode: 'live' as const },
};

describe('Dataviz', () => {
  it('should require dimensions when measure is not a count', () => {
    expect(
      () =>
        new Dataviz({
          id: 'dv_invalid',
          name: 'Untitled visualization',
          query: {
            sources: [{ templateId: '507f1f77bcf86cd799439011' }],
            dimensions: [],
            measures: [{ aggregation: 'sum', property: 'price', propertyType: 'numeric' }],
          },
          chart: { type: 'metric' },
          appearance: { colorMode: 'from_data' },
          refresh: { refreshMode: 'live' },
        })
    ).toThrow(DatavizInvalidQueryError);
  });

  it('should allow metric count queries without dimensions', () => {
    expect(
      () =>
        new Dataviz({
          id: 'dv_metric',
          name: 'Entity total',
          query: {
            sources: [{ templateId: '507f1f77bcf86cd799439011' }],
            dimensions: [],
            measures: [{ aggregation: 'count', countMode: 'all' }],
          },
          chart: { type: 'metric' },
          appearance: { colorMode: 'theme' },
          refresh: { refreshMode: 'live' },
        })
    ).not.toThrow();
  });

  it('should allow dataviz when chart type does not match query shape', () => {
    expect(
      () =>
        new Dataviz({
          ...validBase,
          query: {
            sources: [{ templateId: '507f1f77bcf86cd799439011' }],
            dimensions: [{ property: 'date', propertyType: 'date' }],
            measures: [{ aggregation: 'count' }],
          },
          chart: { type: 'pie' },
        })
    ).not.toThrow();
  });

  it('should reject live refresh for multi-source queries', () => {
    expect(
      () =>
        new Dataviz({
          ...validBase,
          query: {
            ...validBase.query,
            sources: [{ templateId: 't1' }, { templateId: 't2' }],
          },
          refresh: { refreshMode: 'live' },
        })
    ).toThrow(DatavizLiveNotAllowedError);
  });

  it('should expose isManual for manual data sources', () => {
    const dataviz = new Dataviz({
      id: 'dv_manual',
      name: 'Manual chart',
      dataSource: 'manual',
      query: {
        sources: [],
        dimensions: [],
        measures: [{ aggregation: 'count', countMode: 'all' }],
      },
      manualData: {
        series: [{ id: 'main', label: 'Series', points: [{ key: 'a', label: 'A', value: 1 }] }],
      },
      chart: { type: 'bar' },
      appearance: { colorMode: 'theme' },
      refresh: { refreshMode: 'snapshot_manual' },
    });

    expect(dataviz.isManual).toBe(true);
  });

  describe('requiresSnapshotRegenerationFrom', () => {
    const baseDataviz = () =>
      new Dataviz({
        id: 'dv1',
        name: 'Chart',
        query: {
          sources: [{ templateId: 't1' }],
          dimensions: [{ property: 'color', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
        },
        chart: { type: 'pie' },
        appearance: { colorMode: 'theme' },
        refresh: { refreshMode: 'live' },
        skipValidation: true,
      });

    it('returns true when query changes', () => {
      const existing = baseDataviz();
      const updated = new Dataviz({
        ...(({ createdAt: _createdAt, updatedAt: _updatedAt, ...definition }) => definition)(
          existing.toDefinition()
        ),
        query: {
          ...existing.query,
          dimensions: [{ property: 'brand', propertyType: 'select' }],
        },
        skipValidation: true,
      });

      expect(updated.requiresSnapshotRegenerationFrom(existing)).toBe(true);
    });

    it('returns false when only name changes', () => {
      const existing = baseDataviz();
      const updated = new Dataviz({
        ...(({ createdAt: _createdAt, updatedAt: _updatedAt, ...definition }) => definition)(
          existing.toDefinition()
        ),
        name: 'Renamed chart',
        skipValidation: true,
      });

      expect(updated.requiresSnapshotRegenerationFrom(existing)).toBe(false);
    });

    it('returns true when chart config changes', () => {
      const existing = baseDataviz();
      const updated = new Dataviz({
        ...(({ createdAt: _createdAt, updatedAt: _updatedAt, ...definition }) => definition)(
          existing.toDefinition()
        ),
        chart: { type: 'bar' },
        skipValidation: true,
      });

      expect(updated.requiresSnapshotRegenerationFrom(existing)).toBe(true);
    });
  });
});
