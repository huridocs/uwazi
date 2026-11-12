import { ConflictError } from '#api/core/domain/error/ConflictError.js';

class TenantConflict extends ConflictError {
  constructor(name: string) {
    super(`Tenant "${name}" already exists in the active registry`, 'tenant.conflict');
  }
}

export { TenantConflict };
