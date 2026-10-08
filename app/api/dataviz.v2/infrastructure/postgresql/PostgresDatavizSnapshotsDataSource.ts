import { DatavizSnapshotsDataSource } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import type { DatavizSnapshot } from '#api/dataviz.v2/application/contracts/DatavizSnapshotsDataSource.js';
import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { Result } from '#api/core/libs/Result.js';
import { DatavizSnapshotRow } from './DatavizRow.js';
import { PostgresDatavizMapper } from './PostgresDatavizMapper.js';

class PostgresDatavizSnapshotsDataSource
  extends PostgresDataSource<DatavizSnapshotRow>
  implements DatavizSnapshotsDataSource
{
  constructor(deps: PostgresDataSourceDeps) {
    super('dataviz_snapshots', deps);
  }

  async upsert(snapshot: DatavizSnapshot): Promise<void> {
    await this.table.upsert(PostgresDatavizMapper.snapshotToRow(snapshot));
  }

  async getByDatavizId(datavizId: string) {
    const row = await this.table.where({ datavizId }).first();
    if (!row) {
      return Result.fail(new Error(`Snapshot not found for dataviz: ${datavizId}`));
    }
    return Result.ok(PostgresDatavizMapper.snapshotToDomain(row));
  }

  async deleteByDatavizId(datavizId: string): Promise<void> {
    await this.table.where({ datavizId }).delete();
  }
}

export { PostgresDatavizSnapshotsDataSource };
