import { Db } from 'mongodb';
import { PostgresTable } from './PostgresTable.js';
import { PostgresTransactionManager } from './PostgresTransactionManager.js';
import { SyncLogWriter } from './SyncLogWriter.js';

type SyncOptions = {
  syncDb: Db;
  syncNamespace: string;
};

type Deps = {
  tenantId: string;
  pgTransactionManager: PostgresTransactionManager;
  sync?: SyncOptions;
};

export abstract class PostgresDataSource<TRow = Record<string, unknown>> {
  private _table: PostgresTable<TRow>;

  private _syncWriter?: SyncLogWriter;

  constructor(tableName: string, { tenantId, pgTransactionManager, sync }: Deps) {
    if (sync) {
      this._syncWriter = new SyncLogWriter(sync.syncDb, sync.syncNamespace);
    }

    this._table = PostgresTable.for<TRow>({
      tableName,
      tenantId,
      transactionManager: pgTransactionManager,
      syncWriter: this._syncWriter,
    });
  }

  protected get table(): PostgresTable<TRow> {
    return this._table;
  }
}

export type { Deps as PostgresDataSourceDeps };
