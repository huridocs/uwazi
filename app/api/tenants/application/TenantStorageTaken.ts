import { ConflictError } from '#api/core/domain/error/ConflictError.js';

/** Two tenants on one database or index would read and write each other's data. */
class TenantStorageTaken extends ConflictError {
  constructor(kind: 'database' | 'index', value: string, owner: string) {
    super(`The ${kind} "${value}" is already used by tenant "${owner}"`, 'tenant.storage_taken');
  }
}

export { TenantStorageTaken };
