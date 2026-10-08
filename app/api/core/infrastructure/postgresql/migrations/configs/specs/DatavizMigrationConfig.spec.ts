import { ObjectId } from 'mongodb';
import { DatavizMigrationConfig } from '../DatavizMigrationConfig.js';

const query = { sources: [{ templateId: 'template1' }], dimensions: [], measures: [] };
const chart = { type: 'bar' };
const appearance = { colorMode: 'single' };
const refresh = { refreshMode: 'snapshot_scheduled', lastRefreshedAt: '2026-01-01T00:00:00.000Z' };

describe('DatavizMigrationConfig', () => {
  it('should map mongo dataviz docs to dataviz rows', () => {
    const _id = new ObjectId();
    const createdAt = Date.UTC(2026, 0, 1);
    const updatedAt = Date.UTC(2026, 0, 2);

    const mapped = DatavizMigrationConfig.mapDocument({
      _id,
      name: 'Chart',
      description: 'A chart',
      dataSource: 'manual',
      query,
      manualData: { rows: [] },
      chart,
      appearance,
      refresh,
      processing: { active: false },
      embedPublic: true,
      createdAt,
      updatedAt,
    });

    expect(DatavizMigrationConfig.mongoCollection).toBe('dataviz');
    expect(DatavizMigrationConfig.pgTable).toBe('dataviz');
    expect(mapped).toEqual({
      _id: _id.toHexString(),
      name: 'Chart',
      description: 'A chart',
      dataSource: 'manual',
      query,
      manualData: { rows: [] },
      chart,
      appearance,
      refresh,
      processing: { active: false },
      embedPublic: true,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
    });
  });

  it('should leave missing optional fields null and default embedPublic to false', () => {
    const _id = new ObjectId();

    const mapped = DatavizMigrationConfig.mapDocument({
      _id,
      name: 'Chart',
      query,
      chart,
      appearance,
      refresh,
      createdAt: 1,
      updatedAt: 2,
    });

    expect(mapped).toEqual({
      _id: _id.toHexString(),
      name: 'Chart',
      description: null,
      dataSource: null,
      query,
      manualData: null,
      chart,
      appearance,
      refresh,
      processing: null,
      embedPublic: false,
      createdAt: new Date(1),
      updatedAt: new Date(2),
    });
  });
});
