import { Db } from 'mongodb';
import { PostgresTable } from './PostgresTable.js';
import { SyncedPostgresTable } from './SyncedPostgresTable.js';

type SyncOptions = {
  syncDb: Db;
  syncNamespace: string;
};

export abstract class PostgresDataSource {
  protected abstract tableName: string;

  private _tenantId: string;

  private _syncOptions: SyncOptions | null = null;

  private _table: PostgresTable | null = null;

  constructor({ tenantId, sync }: { tenantId: string; sync?: SyncOptions }) {
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
          this._syncOptions.syncNamespace
        );
      } else {
        this._table = new PostgresTable(this.tableName, this._tenantId);
      }
    }
    return this._table;
  }
}
