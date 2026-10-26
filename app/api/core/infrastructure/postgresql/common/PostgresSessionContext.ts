export type PermissionContext = { bypass: boolean; refIds: string[] };

/**
 * The transaction-local variables row level security reads: the tenant and the permission
 * context. Builds the statement that sets them, every value bound.
 */
export class PostgresSessionContext {
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
}
