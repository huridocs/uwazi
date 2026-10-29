import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import { NotPostgresTenantError } from '#api/infrastructure/tenant_backup/NotPostgresTenantError.js';

/** The backup commands move PostgreSQL rows only; a tenant not on Postgres has none to move. */
export function assertPostgresCoreTenant(): void {
  if (!isPostgresCoreActive()) {
    throw new NotPostgresTenantError(ExecutionContext.currentTenant.name);
  }
}
