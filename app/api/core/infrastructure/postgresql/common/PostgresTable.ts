import knex, { Knex } from 'knex';
import { PostgresQueryBuilder } from './PostgresQueryBuilder.js';

export type PostgresConnectionConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

const _knexCache = new Map<string, Knex>();

export function knexForConfig(config: PostgresConnectionConfig): Knex {
  const key = `${config.host}:${config.port}/${config.database}`;
  let kx = _knexCache.get(key);
  if (!kx) {
    kx = knex({
      client: 'pg',
      connection: config,
      useNullAsDefault: true,
    });
    _knexCache.set(key, kx);
  }
  return kx;
}

export async function destroyKnexConnections() {
  const promises = Array.from(_knexCache.values()).map(async kx => kx.destroy());
  _knexCache.clear();
  return Promise.all(promises).then(() => undefined);
}

export { PostgresQueryBuilder };

export class PostgresTable {
  protected knex: Knex;

  readonly tableName: string;

  readonly tenantId: string;

  constructor(connection: PostgresConnectionConfig, tableName: string, tenantId: string) {
    this.tableName = tableName;
    this.tenantId = tenantId;
    this.knex = knexForConfig(connection);
  }

  query<TRow = Record<string, unknown>>(): PostgresQueryBuilder<TRow> {
    return new PostgresQueryBuilder<TRow>(this.knex, this.tableName, this.tenantId);
  }

  async insert(doc: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    const rows = Array.isArray(doc)
      ? doc.map(row => ({ ...row, tenant_id: this.tenantId }))
      : { ...doc, tenant_id: this.tenantId };
    await this.knex(this.tableName).insert(rows);
  }

  async upsert(doc: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    const rows = Array.isArray(doc)
      ? doc.map(row => ({ ...row, tenant_id: this.tenantId }))
      : { ...doc, tenant_id: this.tenantId };
    await this.knex(this.tableName).insert(rows).onConflict(['_id', 'tenant_id']).merge();
  }
}
