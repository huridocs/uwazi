import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { CsvImportThesauriValuesDataSource } from '../../application/contracts/CsvImportThesauriValuesDataSource.js';
import {
  CsvImportThesauriAppliedValue,
  CsvImportThesauriStats,
  CsvImportThesauriValues,
} from '../../domain/CsvImportThesauriValues.js';
import {
  CsvImportThesauriValuesRow,
  PostgresCsvImportThesauriValuesMapper,
} from './PostgresCsvImportThesauriValuesMapper.js';

export class PostgresCsvImportThesauriValuesDataSource
  extends PostgresDataSource<CsvImportThesauriValuesRow>
  implements CsvImportThesauriValuesDataSource
{
  constructor(deps: { tenantId: string; pgTransactionManager: PostgresTransactionManager }) {
    super('csv_import_thesauri_values', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
    });
  }

  async replacePendingValues(
    importId: string,
    pendingValues: CsvImportThesauriValues[]
  ): Promise<void> {
    await this.deleteByImport(importId);
    if (!pendingValues.length) {
      return;
    }
    await this.table.insert(pendingValues.map(PostgresCsvImportThesauriValuesMapper.toRow));
  }

  async getByImport(importId: string): Promise<CsvImportThesauriValues[]> {
    const rows = await this.table.where({ import_id: importId }).all();
    return rows.map(PostgresCsvImportThesauriValuesMapper.toDomain);
  }

  async deleteByImport(importId: string): Promise<void> {
    await this.table.where({ import_id: importId }).delete();
  }

  async markAsApplied(input: {
    importId: string;
    thesaurusId: string;
    appliedAt: number;
    appliedValues: CsvImportThesauriAppliedValue[];
    stats: CsvImportThesauriStats;
  }): Promise<void> {
    await this.table.where({ import_id: input.importId, thesaurus_id: input.thesaurusId }).update({
      applied_at: input.appliedAt,
      applied_values: input.appliedValues,
      stats: input.stats,
    });
  }
}
