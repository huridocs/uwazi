import { Knex } from 'knex';

export class PostgresQueryBuilder<TRow> {
  protected qb: Knex.QueryBuilder;

  constructor(knex: Knex, tableName: string, tenantId: string) {
    this.qb = knex(tableName).where('tenant_id', tenantId);
  }

  where(condition: Record<string, unknown>): this {
    for (const [key, rawValue] of Object.entries(condition)) {
      this.qb = this.qb.where(key, rawValue as Knex.Value);
    }
    return this;
  }

  whereNot(column: string, value: unknown): this {
    this.qb = this.qb.whereNot(column, value as Knex.Value);
    return this;
  }

  whereIn(column: string, values: unknown[]): this {
    this.qb = this.qb.whereIn(column, values as Knex.Value[]);
    return this;
  }

  whereNotIn(column: string, values: unknown[]): this {
    this.qb = this.qb.whereNotIn(column, values as Knex.Value[]);
    return this;
  }

  rawWhere(sql: string, bindings?: Knex.Value[]): this {
    this.qb = this.qb.andWhereRaw(sql, bindings);
    return this;
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.qb = this.qb.orderBy(column, direction);
    return this;
  }

  limit(n: number): this {
    this.qb = this.qb.limit(n);
    return this;
  }

  offset(n: number): this {
    this.qb = this.qb.offset(n);
    return this;
  }

  select(columns: string[]): this {
    this.qb = this.qb.select(columns);
    return this;
  }

  async first(): Promise<TRow | undefined> {
    return this.qb.first() as Promise<TRow | undefined>;
  }

  async all(): Promise<TRow[]> {
    return this.qb as Promise<TRow[]>;
  }

  async count(): Promise<number> {
    const result = await this.qb.clone().count<{ count: string }[]>('* as count').first();
    return parseInt(result?.count ?? '0', 10);
  }

  async update(changes: Record<string, unknown>): Promise<void> {
    await this.qb.update(changes);
  }

  async delete(): Promise<void> {
    await this.qb.del();
  }
}
