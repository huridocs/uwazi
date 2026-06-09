import { PostgresConnectionConfig, PostgresTable } from './PostgresTable.js';

export abstract class PostgresDataSource {
  protected abstract tableName: string;

  private _connection: PostgresConnectionConfig;

  private _tenantId: string;

  private _table: PostgresTable | null = null;

  constructor({
    connection,
    tenantId,
  }: {
    connection: PostgresConnectionConfig;
    tenantId: string;
  }) {
    this._connection = connection;
    this._tenantId = tenantId;
  }

  protected get table(): PostgresTable {
    if (!this._table) {
      this._table = new PostgresTable(this._connection, this.tableName, this._tenantId);
    }
    return this._table;
  }
}
