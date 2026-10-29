import { DomainError } from '#api/core/domain/error/DomainError.js';

/** The current tenant's data is not in Postgres, so it cannot be exported, imported or cleaned. */
export class NotPostgresTenantError extends DomainError {
  static readonly category = 'conflict' as const;

  constructor(tenant: string) {
    super(
      `Tenant '${tenant}' is not running on Postgres, so its PostgreSQL data cannot be exported, imported or cleaned.`,
      'tenant_backup.not_postgres'
    );
  }
}
