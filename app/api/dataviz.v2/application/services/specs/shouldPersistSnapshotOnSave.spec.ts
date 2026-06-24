import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { shouldPersistSnapshotOnSave } from '../shouldPersistSnapshotOnSave.js';

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

describe('shouldPersistSnapshotOnSave', () => {
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

    expect(shouldPersistSnapshotOnSave(existing, updated)).toBe(true);
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

    expect(shouldPersistSnapshotOnSave(existing, updated)).toBe(false);
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

    expect(shouldPersistSnapshotOnSave(existing, updated)).toBe(true);
  });
});
