import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { CsvImportRelationshipPendingValuesDataSource } from '../../application/contracts/CsvImportRelationshipPendingValuesDataSource.js';
import { CsvImportRelationshipPendingValues } from '../../domain/CsvImportRelationshipPendingValues.js';
import {
  CsvImportRelationshipPendingValuesRow,
  PostgresCsvImportRelationshipPendingValuesMapper,
} from './PostgresCsvImportRelationshipPendingValuesMapper.js';

export class PostgresCsvImportRelationshipPendingValuesDataSource
  extends PostgresDataSource<CsvImportRelationshipPendingValuesRow>
  implements CsvImportRelationshipPendingValuesDataSource
{
  constructor(deps: { tenantId: string; pgTransactionManager: PostgresTransactionManager }) {
    super('csv_import_relationships_pending_values', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
    });
  }

  async replacePendingValues(
    importId: string,
    docs: CsvImportRelationshipPendingValues[]
  ): Promise<void> {
    await this.table.where({ import_id: importId }).delete();
    if (!docs.length) {
      return;
    }
    await this.table.insert(docs.map(PostgresCsvImportRelationshipPendingValuesMapper.toRow));
  }

  async getByImport(importId: string): Promise<CsvImportRelationshipPendingValues[]> {
    const rows = await this.table.where({ import_id: importId }).all();
    return rows.map(PostgresCsvImportRelationshipPendingValuesMapper.toDomain);
  }
}
