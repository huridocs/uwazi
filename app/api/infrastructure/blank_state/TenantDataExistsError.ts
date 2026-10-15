import { ConflictError } from '#api/core/domain/error/ConflictError.js';

export class TenantDataExistsError extends ConflictError {
  constructor(tenantId: string) {
    super(
      `PostgreSQL data for tenant '${tenantId}' already exists.`,
      'blank_state.tenant_data_exists'
    );
  }
}
