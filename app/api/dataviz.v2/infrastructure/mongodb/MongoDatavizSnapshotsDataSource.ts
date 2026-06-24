import { Db, ObjectId } from 'mongodb';
import {
  DatavizSnapshot,
  DatavizSnapshotsDataSource,
} from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { Result } from '#api/core/libs/Result.js';
import { DatavizMapper } from './DatavizMapper.js';
import { DatavizSnapshotDBO } from './DatavizDBO.js';

class MongoDatavizSnapshotsDataSource
  extends MongoDataSource<DatavizSnapshotDBO>
  implements DatavizSnapshotsDataSource
{
  protected collectionName = 'dataviz_snapshots';

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
  }

  async upsert(snapshot: DatavizSnapshot): Promise<void> {
    const dbo = DatavizMapper.snapshotToDBO(snapshot);
    await this.getCollection().replaceOne({ datavizId: dbo.datavizId }, dbo, {
      upsert: true,
      ignoreUndefined: true,
    });
  }

  async getByDatavizId(datavizId: string) {
    const dbo = await this.getCollection().findOne({
      datavizId: ObjectId.createFromHexString(datavizId),
    });
    if (!dbo) {
      return Result.fail(new Error(`Snapshot not found for dataviz: ${datavizId}`));
    }
    return Result.ok(DatavizMapper.snapshotToDomain(dbo));
  }

  async deleteByDatavizId(datavizId: string): Promise<void> {
    await this.getCollection().deleteMany({
      datavizId: ObjectId.createFromHexString(datavizId),
    });
  }
}

export { MongoDatavizSnapshotsDataSource };
