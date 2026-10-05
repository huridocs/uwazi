import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTable } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { PostgresOcrRecordRow } from './PostgresOcrRecordRow.js';

/** The `ocr_records` table; tenant isolation is its row-level security policy. */
class PostgresOcrRecordDAO extends PostgresDataSource<PostgresOcrRecordRow> {
  constructor(deps: PostgresDataSourceDeps) {
    super('ocr_records', deps);
  }

  rows(): PostgresTable<PostgresOcrRecordRow> {
    return this.table.query();
  }

  /** Inserts the row unless its source file already has one; returns whether it did. */
  async insertForSource(row: Record<string, unknown>): Promise<boolean> {
    if (row.source_file_id === null) {
      await this.table.insert(row);
      return true;
    }
    await this.table.upsert(row, {
      targetRaw: '("tenant_id", "source_file_id") WHERE "source_file_id" IS NOT NULL',
      ignore: true,
    });
    const stored = await this.rows()
      .where({ source_file_id: row.source_file_id })
      .select(['_id'])
      .first();
    return stored?._id === row._id;
  }

  /** Updates a stored row; a row no longer there is not recreated. */
  async updateExisting(row: Record<string, unknown>): Promise<void> {
    const { _id, ...columns } = row;
    await this.rows().where({ _id }).update(columns);
  }
}

export { PostgresOcrRecordDAO };
