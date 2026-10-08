import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import type { DatavizSnapshot } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import type { DatavizRow, DatavizSnapshotRow } from './DatavizRow.js';

class PostgresDatavizMapper {
  static toRow(dataviz: Dataviz): DatavizRow {
    const now = new Date();
    return {
      _id: dataviz.id,
      name: dataviz.name,
      description: dataviz.description,
      dataSource: dataviz.dataSource,
      query: dataviz.query,
      manualData: dataviz.manualData,
      chart: dataviz.chart,
      appearance: dataviz.appearance,
      refresh: dataviz.refresh,
      processing: dataviz.processing,
      embedPublic: dataviz.embedPublic,
      createdAt: dataviz.createdAt ?? now,
      updatedAt: now,
    };
  }

  static toDomain(row: DatavizRow): Dataviz {
    return Dataviz.fromPersistence({
      id: row._id,
      name: row.name,
      description: row.description,
      dataSource: row.dataSource,
      query: row.query,
      manualData: row.manualData,
      chart: row.chart,
      appearance: row.appearance,
      refresh: row.refresh,
      processing: row.processing,
      embedPublic: row.embedPublic,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    });
  }

  static snapshotToRow(snapshot: DatavizSnapshot): DatavizSnapshotRow {
    return {
      _id: snapshot.datavizId,
      datavizId: snapshot.datavizId,
      queryHash: snapshot.queryHash,
      payload: snapshot.payload,
      generatedAt: snapshot.generatedAt,
    };
  }

  static snapshotToDomain(row: DatavizSnapshotRow): DatavizSnapshot {
    return {
      datavizId: row.datavizId,
      queryHash: row.queryHash,
      payload: row.payload,
      generatedAt: new Date(row.generatedAt),
    };
  }
}

export { PostgresDatavizMapper };
