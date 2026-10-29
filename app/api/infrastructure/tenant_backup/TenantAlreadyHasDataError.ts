import { DomainError } from '#api/core/domain/error/DomainError.js';

/** The destination tenant still holds rows; a restore must target an empty tenant (or clean first). */
export class TenantAlreadyHasDataError extends DomainError {
  static readonly category = 'conflict' as const;

  constructor(tenant: string) {
    super(
      `Tenant '${tenant}' already has PostgreSQL data; clean it first or import with --clear.`,
      'tenant_backup.tenant_has_data'
    );
  }
}
