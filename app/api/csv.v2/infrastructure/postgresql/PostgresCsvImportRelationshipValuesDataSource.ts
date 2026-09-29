import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { CsvImportRelationshipValuesDataSource } from '../../application/contracts/CsvImportRelationshipValuesDataSource.js';
import { CsvImportRelationshipValues } from '../../domain/CsvImportRelationshipValues.js';
import {
  CsvImportRelationshipValuesRow,
  PostgresCsvImportRelationshipValuesMapper,
} from './PostgresCsvImportRelationshipValuesMapper.js';

export class PostgresCsvImportRelationshipValuesDataSource
  extends PostgresDataSource<CsvImportRelationshipValuesRow>
  implements CsvImportRelationshipValuesDataSource
{
  constructor(deps: { tenantId: string; pgTransactionManager: PostgresTransactionManager }) {
    super('csv_import_relationships_values', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
    });
  }

  async replaceValues(importId: string, docs: CsvImportRelationshipValues[]): Promise<void> {
    await this.table.where({ import_id: importId }).delete();
    if (!docs.length) {
      return;
    }
    await this.table.insert(docs.map(PostgresCsvImportRelationshipValuesMapper.toRow));
  }

  async getByImport(importId: string): Promise<CsvImportRelationshipValues[]> {
    const rows = await this.table.where({ import_id: importId }).all();
    return rows.map(PostgresCsvImportRelationshipValuesMapper.toDomain);
  }
}
