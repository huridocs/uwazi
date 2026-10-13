import { PostgresTable } from './PostgresTable.js';
import { PostgresTransactionManager } from './PostgresTransactionManager.js';
import { SyncLogWriter } from './SyncLogWriter.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';

type SyncOptions = {
  syncNamespace: string;
};

type Deps = {
  tenantId: string;
  pgTransactionManager: PostgresTransactionManager;
  accessContext: AccessContext;
  sync?: SyncOptions;
};

export abstract class PostgresDataSource<TRow = Record<string, unknown>> {
  private _table: PostgresTable<TRow>;

  private _syncWriter?: SyncLogWriter;

  constructor(tableName: string, { tenantId, pgTransactionManager, accessContext, sync }: Deps) {
    if (sync) {
      this._syncWriter = new SyncLogWriter(pgTransactionManager, tenantId, sync.syncNamespace);
    }

    this._table = PostgresTable.for<TRow>({
      tableName,
      tenantId,
      transactionManager: pgTransactionManager,
      accessContext,
      syncWriter: this._syncWriter,
    });
  }

  protected get table(): PostgresTable<TRow> {
    return this._table;
  }
}

export type { Deps as PostgresDataSourceDeps };
