import { Db } from 'mongodb';
import { PostgresConnectionConfig, PostgresTable } from './PostgresTable.js';
import { SyncedPostgresTable } from './SyncedPostgresTable.js';

type SyncOptions = {
  syncDb: Db;
  syncNamespace: string;
};

type Deps = {
  connection: PostgresConnectionConfig;
  tenantId: string;
  sync?: SyncOptions;
};

abstract class PostgresDataSource {
  protected abstract tableName: string;

  protected jsonbColumns: string[] = [];

  private _connection: PostgresConnectionConfig;

  private _tenantId: string;

  private _syncOptions: SyncOptions | null = null;

  private _table: PostgresTable | null = null;

  constructor({ connection, tenantId, sync }: Deps) {
    this._connection = connection;
    this._tenantId = tenantId;
    if (sync) {
      this._syncOptions = sync;
    }
  }

  protected get table(): PostgresTable {
    if (!this._table) {
      if (this._syncOptions) {
        this._table = new SyncedPostgresTable(
          this._connection,
          this.tableName,
          this._tenantId,
          this._syncOptions.syncDb,
          this._syncOptions.syncNamespace,
          this.jsonbColumns
        );
      } else {
        this._table = new PostgresTable(
          this._connection,
          this.tableName,
          this._tenantId,
          this.jsonbColumns
        );
      }
    }
    return this._table;
  }
}

export { PostgresDataSource };
export type { Deps as PostgresDataSourceDeps };
