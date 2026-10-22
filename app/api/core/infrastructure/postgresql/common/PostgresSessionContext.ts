import { Knex } from 'knex';

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

  private static same(a: PermissionContext, b: PermissionContext): boolean {
    return a.bypass === b.bypass && a.refIds.join(',') === b.refIds.join(',');
  }

  current(trx: Knex.Transaction): PermissionContext {
    return this.applied.get(trx) ?? PostgresSessionContext.normalize();
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
