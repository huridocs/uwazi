import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTable } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { PostgresSegmentationRow } from './PostgresSegmentationRow.js';

/** The `segmentations` table; tenant isolation is its row-level security policy. */
class PostgresSegmentationDAO extends PostgresDataSource<PostgresSegmentationRow> {
  constructor(deps: PostgresDataSourceDeps) {
    super('segmentations', deps);
  }

  rows(): PostgresTable<PostgresSegmentationRow> {
    return this.table.query();
  }

  /** Inserts the row unless its file already has one; returns whether it did. */
  async insertForFile(row: Record<string, unknown>): Promise<boolean> {
    await this.table.upsert(row, { columns: ['tenant_id', 'file_id'], ignore: true });
    const stored = await this.rows().where({ file_id: row.file_id }).select(['_id']).first();
    return stored?._id === row._id;
  }

  /** Updates a stored row; a row no longer there is not recreated. */
  async updateExisting(row: Record<string, unknown>): Promise<void> {
    const { _id, ...columns } = row;
    await this.rows().where({ _id }).update(columns);
  }

  async deleteWhereIn(column: string, values: string[]): Promise<PostgresSegmentationRow[]> {
    const found = await this.rows().whereIn(column, values).all();
    if (found.length) {
      await this.rows()
        .whereIn(
          '_id',
          found.map(row => row._id)
        )
        .delete();
    }
    return found;
  }
}

export { PostgresSegmentationDAO };
