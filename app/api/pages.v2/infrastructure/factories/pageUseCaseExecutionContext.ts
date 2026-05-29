import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { User } from '#api/users.v2/model/User.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/tenantContext.js';
import type { Tenant } from '#api/tenants/tenantContext.js';

/** Resolves actor/tenant for page use cases. HTTP middleware sets ExecutionContext.actor; fallback is for jobs/tests only. */
export function pageUseCaseExecutionContext() {
  let tenant: Tenant;
  try {
    tenant = ExecutionContext.tenant;
  } catch {
    // Jobs/tests without a full ExecutionContext — fall back to tenants.current() or default
    try {
      tenant = tenants.current();
    } catch {
      tenant = tenants.defaultTenant;
    }
  }

  let actor: User;
  try {
    actor = ExecutionContext.actor!;
  } catch {
    // Jobs/tests without ExecutionContext.actor
    actor = User.createFrom(permissionsContext.getUserInContext() ?? null);
  }

  return { actor, tenant };
}
