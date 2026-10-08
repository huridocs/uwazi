import { ObjectId } from 'mongodb';
import { DatavizSnapshotsMigrationConfig } from '../DatavizSnapshotsMigrationConfig.js';

describe('DatavizSnapshotsMigrationConfig', () => {
  it('should map mongo dataviz_snapshots docs to dataviz_snapshots rows', () => {
    const datavizId = new ObjectId();
    const generatedAt = Date.UTC(2026, 0, 1);
    const payload = { data: { series: [] }, chart: { type: 'bar' } };

    const mapped = DatavizSnapshotsMigrationConfig.mapDocument({
      _id: datavizId,
      datavizId,
      queryHash: 'hash',
      payload,
      generatedAt,
    });

    expect(DatavizSnapshotsMigrationConfig.mongoCollection).toBe('dataviz_snapshots');
    expect(DatavizSnapshotsMigrationConfig.pgTable).toBe('dataviz_snapshots');
    expect(mapped).toEqual({
      _id: datavizId.toHexString(),
      datavizId: datavizId.toHexString(),
      queryHash: 'hash',
      payload,
      generatedAt: new Date(generatedAt),
    });
  });
});
