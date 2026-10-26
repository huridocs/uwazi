import { Knex } from 'knex';
import { escapeLiteral } from 'pg';

/**
 * A value as a SQL literal that survives knex: knex turns every `?` it finds into a `$n` binding,
 * even with no bindings, unless an odd number of backslashes precedes it. `escapeLiteral` doubles
 * every backslash, so one more before each `?` is enough.
 */
const literal = (value: string): string => escapeLiteral(value).replace(/\?/g, '\\?');

export type PermissionContext = { bypass: boolean; refIds: string[] };

/**
 * Sets the transaction-local variables row level security reads: the tenant and the permission
 * context. Records the context last sent on each transaction when the statement is issued; a
 * connection runs its statements in issue order, so that is the context the next statement on the
 * transaction sees. Reading it from here, instead of from the database, saves a round trip.
 */
export class PostgresSessionContext {
  private applied = new WeakMap<Knex.Transaction, PermissionContext>();

  constructor(private tenantId: string) {}

  static normalize(permissionContext?: Partial<PermissionContext>): PermissionContext {
    const { bypass = false, refIds = [] } = permissionContext ?? {};
    return { bypass, refIds };
  }

  static same(a: PermissionContext, b: PermissionContext): boolean {
    return a.bypass === b.bypass && a.refIds.join(',') === b.refIds.join(',');
  }

  /** The statement that sets the tenant and a permission context, every value bound. */
  statement(permissionContext?: PermissionContext): { text: string; values: string[] } {
    const context = PostgresSessionContext.normalize(permissionContext);
    return {
      text: `SELECT set_config('app.current_tenant', $1, true),
              set_config('uwazi.bypass_rls', $2, true),
              set_config('uwazi.ref_ids', $3, true)`,
      values: [this.tenantId, String(context.bypass), context.refIds.join(',')],
    };
  }

  current(trx: Knex.Transaction): PermissionContext {
    return this.applied.get(trx) ?? PostgresSessionContext.normalize();
  }

  /**
   * The statement that sets the tenant and a permission context, for sending with BEGIN. It carries
   * no bindings (it travels as a simple query), so every value is escaped as a literal.
   */
  beginSql(permissionContext?: PermissionContext): string {
    const context = PostgresSessionContext.normalize(permissionContext);
    return `SELECT set_config('app.current_tenant', ${literal(this.tenantId)}, true),
              set_config('uwazi.bypass_rls', ${literal(String(context.bypass))}, true),
              set_config('uwazi.ref_ids', ${literal(context.refIds.join(','))}, true);`;
  }

  /** Records a context as sent, when it went out with BEGIN. */
  markApplied(trx: Knex.Transaction, permissionContext?: PermissionContext): void {
    this.applied.set(trx, PostgresSessionContext.normalize(permissionContext));
  }

  /** Sets the tenant and the permission context in a single statement. */
  async open(trx: Knex.Transaction, permissionContext?: PermissionContext): Promise<void> {
    const context = PostgresSessionContext.normalize(permissionContext);
    this.applied.set(trx, context);
    await trx.raw(
      `SELECT set_config('app.current_tenant', ?, true),
              set_config('uwazi.bypass_rls', ?, true),
              set_config('uwazi.ref_ids', ?, true)`,
      [this.tenantId, String(context.bypass), context.refIds.join(',')]
    );
  }

  /** Switches the permission context of an open transaction; sends nothing when it is unchanged. */
  async switch(trx: Knex.Transaction, permissionContext?: PermissionContext): Promise<void> {
    const context = PostgresSessionContext.normalize(permissionContext);
    if (PostgresSessionContext.same(this.current(trx), context)) return;
    await this.open(trx, context);
  }
}
