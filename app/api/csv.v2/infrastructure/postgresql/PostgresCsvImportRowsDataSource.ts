import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { CsvImportRowsDataSource } from '../../application/contracts/CsvImportRowsDataSource.js';
import { CsvImportRow } from '../../domain/CsvImportRow.js';
import { CsvImportRowRow, PostgresCsvImportRowMapper } from './PostgresCsvImportRowMapper.js';

export class PostgresCsvImportRowsDataSource
  extends PostgresDataSource<CsvImportRowRow>
  implements CsvImportRowsDataSource
{
  constructor(deps: { tenantId: string; pgTransactionManager: PostgresTransactionManager }) {
    super('csv_import_rows', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
    });
  }

  async insertMany(rows: CsvImportRow[]): Promise<void> {
    if (!rows.length) {
      return;
    }
    await this.table.insert(rows.map(PostgresCsvImportRowMapper.toRow));
  }

  async countByImport(importId: string): Promise<number> {
    return this.table.where({ import_id: importId }).count();
  }

  async getByImport(importId: string, offset = 0, limit = 0): Promise<CsvImportRow[]> {
    let query = this.table.where({ import_id: importId }).orderBy('row_index', 'asc');
    if (offset) {
      query = query.offset(offset);
    }
    if (limit > 0) {
      query = query.limit(limit);
    }
    const rows = await query.all();
    return rows.map(PostgresCsvImportRowMapper.toDomain);
  }

  async getByImportAndIndexes(importId: string, indexes: number[]): Promise<CsvImportRow[]> {
    if (!indexes.length) {
      return [];
    }
    const rows = await this.table
      .where({ import_id: importId })
      .whereIn('row_index', indexes)
      .orderBy('row_index', 'asc')
      .all();
    return rows.map(PostgresCsvImportRowMapper.toDomain);
  }

  async deleteByImport(importId: string): Promise<void> {
    await this.table.where({ import_id: importId }).delete();
  }
}
