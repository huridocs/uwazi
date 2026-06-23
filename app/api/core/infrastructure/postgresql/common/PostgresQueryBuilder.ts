import { Knex } from 'knex';

export class PostgresQueryBuilder<TRow> {
  protected qb: Knex.QueryBuilder;

  private tableName: string;

  constructor(knex: Knex, tableName: string, tenantId: string) {
    this.tableName = tableName;
    this.qb = knex(tableName).where(`${tableName}.tenant_id`, tenantId);
  }

  where(condition: Record<string, unknown>): this {
    for (const [key, rawValue] of Object.entries(condition)) {
      this.qb = this.qb.where(key, rawValue as Knex.Value);
    }
    return this;
  }

  whereAny(conditions: Record<string, unknown>[]): this {
    this.qb = this.qb.where(knex =>
      conditions.forEach((condition, i) =>
        i === 0 ? knex.where(condition) : knex.orWhere(condition)
      )
    );
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

  join(tableName: string, leftColumn: string, rightColumn: string): this {
    this.qb = this.qb.join(tableName, builder => {
      builder.on(leftColumn, '=', rightColumn);
      builder.andOn(`${tableName}.tenant_id`, '=', `${this.tableName}.tenant_id`);
    });
    return this;
  }

  leftJoin(tableName: string, leftColumn: string, rightColumn: string): this {
    this.qb = this.qb.leftJoin(tableName, builder => {
      builder.on(leftColumn, '=', rightColumn);
      builder.andOn(`${tableName}.tenant_id`, '=', `${this.tableName}.tenant_id`);
    });
    return this;
  }

  groupBy(columns: string[]): this {
    this.qb = this.qb.groupBy(columns);
    return this;
  }

  distinct(columns: string[]): this {
    this.qb = this.qb.distinct(columns);
    return this;
  }

  returning(columns: string[]): this {
    this.qb = this.qb.returning(columns);
    return this;
  }

  private stripTenantId(row: Record<string, unknown>): Record<string, unknown> {
    const { tenant_id: _, ...rest } = row;
    return rest;
  }

  async first(): Promise<TRow | undefined> {
    const row = await this.qb.first();
    if (!row) return undefined;
    return this.stripTenantId(row) as TRow;
  }

  async all(): Promise<TRow[]> {
    const rows = (await this.qb) as Record<string, unknown>[];
    return rows.map(r => this.stripTenantId(r)) as TRow[];
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
