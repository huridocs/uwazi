import { Db } from 'mongodb';
import { PostgresTable } from './PostgresTable.js';
import { SyncedPostgresTable } from './SyncedPostgresTable.js';

type SyncOptions = {
  syncDb: Db;
  syncNamespace: string;
};

type Deps = { tenantId: string; sync?: SyncOptions };

export abstract class PostgresDataSource {
  protected abstract tableName: string;

  private _tenantId: string;

  private _syncOptions: SyncOptions | null = null;

  private _table: PostgresTable | null = null;

  protected jsonbColumns: string[] = [];

  constructor({ tenantId, sync }: Deps) {
    this._tenantId = tenantId;
    if (sync) {
      this._syncOptions = sync;
    }
  }

  protected get table(): PostgresTable {
    if (!this._table) {
      if (this._syncOptions) {
        this._table = new SyncedPostgresTable(
          this.tableName,
          this._tenantId,
          this._syncOptions.syncDb,
          this._syncOptions.syncNamespace,
          this.jsonbColumns
        );
      } else {
        this._table = new PostgresTable(this.tableName, this._tenantId, this.jsonbColumns);
      }
    }
    return this._table;
  }
}

export type { Deps as PostgresDataSourceDeps };
