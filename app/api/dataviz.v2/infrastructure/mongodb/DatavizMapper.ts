import { ObjectId } from 'mongodb';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { DatavizNotFoundError } from '#api/dataviz.v2/domain/errors.js';
import type { DatavizSnapshot } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import type { DatavizSnapshotRenderPayload } from '#shared/types/datavizSchema.js';
import type { DatavizDBO, DatavizSnapshotDBO } from './DatavizDBO.js';

class DatavizMapper {
  static toDBO(dataviz: Dataviz): DatavizDBO {
    const now = Date.now();
    return {
      _id: ObjectId.createFromHexString(dataviz.id),
      name: dataviz.name,
      description: dataviz.description,
      dataSource: dataviz.dataSource,
      query: dataviz.query,
      manualData: dataviz.manualData,
      chart: dataviz.chart,
      appearance: dataviz.appearance,
      refresh: dataviz.refresh,
      processing: dataviz.processing,
      createdAt: dataviz.createdAt?.getTime() ?? now,
      updatedAt: now,
    };
  }

  static toDomain(dbo: DatavizDBO): Dataviz {
    return Dataviz.fromPersistence({
      id: dbo._id.toHexString(),
      name: dbo.name,
      description: dbo.description,
      dataSource: dbo.dataSource,
      query: dbo.query,
      manualData: dbo.manualData,
      chart: dbo.chart,
      appearance: dbo.appearance,
      refresh: dbo.refresh,
      processing: dbo.processing,
      createdAt: new Date(dbo.createdAt).toISOString(),
      updatedAt: new Date(dbo.updatedAt).toISOString(),
    });
  }

  static snapshotToDBO(snapshot: DatavizSnapshot): DatavizSnapshotDBO {
    return {
      _id: ObjectId.createFromHexString(snapshot.datavizId),
      datavizId: ObjectId.createFromHexString(snapshot.datavizId),
      queryHash: snapshot.queryHash,
      payload: snapshot.payload,
      generatedAt: snapshot.generatedAt.getTime(),
    };
  }

  static snapshotToDomain(dbo: DatavizSnapshotDBO): DatavizSnapshot {
    return {
      datavizId: dbo.datavizId.toHexString(),
      queryHash: dbo.queryHash,
      payload: dbo.payload as DatavizSnapshotRenderPayload,
      generatedAt: new Date(dbo.generatedAt),
    };
  }

  static notFoundError(id: string) {
    return new DatavizNotFoundError(id);
  }
}

export { DatavizMapper };
