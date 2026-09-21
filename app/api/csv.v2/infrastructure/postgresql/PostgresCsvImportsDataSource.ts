import { Result, ResultType } from '#api/core/libs/Result.js';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { CsvImportEntitiesImportsDataSource } from '../../application/contracts/CsvImportEntitiesImportsDataSource.js';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource.js';
import { CsvImportDoesNotExistError } from '../../domain/csvImporErrors.js';
import { CsvImport, CsvImportStatus } from '../../domain/CsvImport.js';
import { CsvImportRow, PostgresCsvImportMapper } from './PostgresCsvImportMapper.js';

const TERMINAL_STATUSES_BLOCKING_CANCEL = [
  CsvImportStatus.Cancelled,
  CsvImportStatus.Completed,
  CsvImportStatus.ImportEntitiesDone,
  CsvImportStatus.Failed,
];

const jsonBinding = (value: unknown) => (value === undefined ? null : JSON.stringify(value));

export class PostgresCsvImportsDataSource
  extends PostgresDataSource<CsvImportRow>
  implements CsvImportsDataSource, CsvImportEntitiesImportsDataSource
{
  constructor(deps: { tenantId: string; pgTransactionManager: PostgresTransactionManager }) {
    super('csv_imports', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
    });
  }

  async insert(doc: CsvImport): Promise<void> {
    await this.table.insert(PostgresCsvImportMapper.toRow(doc));
  }

  async update(doc: CsvImport): Promise<void> {
    const row = PostgresCsvImportMapper.toRow(doc);
    await this.table.raw(
      `UPDATE csv_imports SET
         "template_id" = ?,
         "created_by" = ?,
         "created_at" = ?,
         "updated_at" = ?,
         "files_cleanup" = ?,
         "file" = ?::jsonb,
         "storage" = ?::jsonb,
         "stats" = ?::jsonb,
         "progress" = ?::jsonb,
         "extraction" = ?::jsonb,
         "failure" = ?::jsonb,
         "row_errors" = ?::jsonb,
         "status" = CASE WHEN "status" = ? THEN "status" ELSE ? END
       WHERE "_id" = ?`,
      [
        row.template_id,
        row.created_by,
        row.created_at,
        row.updated_at,
        row.files_cleanup ?? null,
        jsonBinding(row.file),
        jsonBinding(row.storage),
        jsonBinding(row.stats),
        jsonBinding(row.progress),
        jsonBinding(row.extraction),
        jsonBinding(row.failure),
        jsonBinding(row.row_errors),
        CsvImportStatus.Cancelled,
        row.status,
        row._id,
      ]
    );
  }

  async cancel(importId: string): Promise<void> {
    await this.table.raw(
      `UPDATE csv_imports
       SET "status" = ?, "files_cleanup" = ?, "updated_at" = ?
       WHERE "_id" = ? AND "status" NOT IN (?, ?, ?, ?)`,
      [
        CsvImportStatus.Cancelled,
        'pending',
        Date.now(),
        importId,
        ...TERMINAL_STATUSES_BLOCKING_CANCEL,
      ]
    );
  }

  async isCancelled(importId: string): Promise<boolean> {
    const row = await this.table.where({ _id: importId }).first();
    return row?.status === CsvImportStatus.Cancelled;
  }

  async getById(importId: string): Promise<ResultType<CsvImport, CsvImportDoesNotExistError>> {
    const row = await this.table.where({ _id: importId }).first();
    if (!row) {
      return Result.fail(new CsvImportDoesNotExistError(importId));
    }
    return Result.ok(PostgresCsvImportMapper.toDomain(row));
  }

  async getAll(): Promise<CsvImport[]> {
    const rows = await this.table.orderBy('created_at', 'desc').all();
    return rows.map(PostgresCsvImportMapper.toDomain);
  }
}
