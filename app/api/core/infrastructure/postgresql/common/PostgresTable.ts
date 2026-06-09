import knex, { Knex } from 'knex';

export type PostgresConnectionConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

const _knexCache = new Map<string, Knex>();

function knexForConfig(config: PostgresConnectionConfig): Knex {
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

export function destroyKnexConnections(): Promise<void> {
  const promises = Array.from(_knexCache.values()).map(kx => kx.destroy());
  _knexCache.clear();
  return Promise.all(promises).then(() => undefined);
}

export type WhereCondition<TRow> = {
  [K in keyof TRow]?: TRow[K] | { $ne: TRow[K] } | { $in: TRow[K][] };
};

export class PostgresTable {
  private knex: Knex;

  readonly tableName: string;

  readonly tenantId: string;

  constructor(connection: PostgresConnectionConfig, tableName: string, tenantId: string) {
    this.tableName = tableName;
    this.tenantId = tenantId;
    this.knex = knexForConfig(connection);
  }

  private applyWhere(qb: Knex.QueryBuilder, where: Record<string, unknown>): Knex.QueryBuilder {
    for (const [key, rawValue] of Object.entries(where)) {
      if (rawValue !== null && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
        const value = rawValue as Record<string, unknown>;
        if ('$ne' in value) {
          qb = qb.whereNot(key, value.$ne as Knex.Value);
        } else if ('$in' in value) {
          qb = qb.whereIn(key, value.$in as Knex.Value[]);
        }
      } else {
        qb = qb.where(key, rawValue as Knex.Value);
      }
    }
    return qb;
  }

  async findOne<TRow>(where: WhereCondition<TRow>): Promise<TRow | undefined> {
    let qb = this.knex(this.tableName).where('tenant_id', this.tenantId);
    qb = this.applyWhere(qb, where as Record<string, unknown>);
    return qb.first() as Promise<TRow | undefined>;
  }

  async findAll<TRow>(where?: WhereCondition<TRow>): Promise<TRow[]> {
    let qb = this.knex(this.tableName).where('tenant_id', this.tenantId).select('*');
    if (where) {
      qb = this.applyWhere(qb, where as Record<string, unknown>);
    }
    return qb as Promise<TRow[]>;
  }

  async findIds<TRow>(where: WhereCondition<TRow>): Promise<string[]> {
    let qb = this.knex(this.tableName).select('_id').where('tenant_id', this.tenantId);
    qb = this.applyWhere(qb, where as Record<string, unknown>);
    const rows = await qb;
    return rows.map((r: { _id: string }) => r._id);
  }

  async count<TRow>(where?: WhereCondition<TRow>): Promise<number> {
    let qb = this.knex(this.tableName)
      .where('tenant_id', this.tenantId)
      .count<{ count: string }[]>('* as count');
    if (where) {
      qb = this.applyWhere(qb, where as Record<string, unknown>);
    }
    const result = await qb.first();
    return parseInt(result?.count ?? '0', 10);
  }

  async insert(row: Record<string, unknown>): Promise<void> {
    await this.knex(this.tableName).insert({ ...row, tenant_id: this.tenantId });
  }

  async insertMany(rows: Record<string, unknown>[]): Promise<void> {
    await this.knex(this.tableName).insert(rows.map(row => ({ ...row, tenant_id: this.tenantId })));
  }

  async upsert(row: Record<string, unknown>, conflictKeys: string[]): Promise<void> {
    await this.knex(this.tableName)
      .insert({ ...row, tenant_id: this.tenantId })
      .onConflict(conflictKeys)
      .merge();
  }

  async update<TRow>(where: WhereCondition<TRow>, changes: Record<string, unknown>): Promise<void> {
    let qb = this.knex(this.tableName).where('tenant_id', this.tenantId);
    qb = this.applyWhere(qb, where as Record<string, unknown>);
    await qb.update(changes);
  }

  async delete<TRow>(where: WhereCondition<TRow>): Promise<void> {
    let qb = this.knex(this.tableName).where('tenant_id', this.tenantId);
    qb = this.applyWhere(qb, where as Record<string, unknown>);
    await qb.del();
  }
}
