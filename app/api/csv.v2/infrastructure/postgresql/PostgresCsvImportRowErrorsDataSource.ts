import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { CsvImportRowErrorsDataSource } from '../../application/contracts/CsvImportRowErrorsDataSource.js';
import { CsvImportRowError } from '../../domain/CsvImportRowError.js';
import {
  CsvImportRowErrorRow,
  PostgresCsvImportRowErrorMapper,
} from './PostgresCsvImportRowErrorMapper.js';

export class PostgresCsvImportRowErrorsDataSource
  extends PostgresDataSource<CsvImportRowErrorRow>
  implements CsvImportRowErrorsDataSource
{
  constructor(deps: { tenantId: string; pgTransactionManager: PostgresTransactionManager }) {
    super('csv_import_row_errors', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
    });
  }

  async insertMany(errors: CsvImportRowError[]): Promise<void> {
    if (!errors.length) {
      return;
    }
    await this.table.insert(errors.map(PostgresCsvImportRowErrorMapper.toRow));
  }

  async countByImport(importId: string): Promise<number> {
    return this.table.where({ import_id: importId }).count();
  }

  async getByImport(importId: string): Promise<CsvImportRowError[]> {
    const rows = await this.table.where({ import_id: importId }).orderBy('row_index', 'asc').all();
    return rows.map(PostgresCsvImportRowErrorMapper.toDomain);
  }

  async deleteByImport(importId: string): Promise<void> {
    await this.table.where({ import_id: importId }).delete();
  }
}
