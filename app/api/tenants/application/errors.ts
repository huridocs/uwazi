import { NotFoundError } from '#api/core/domain/error/NotFoundError.js';

class TenantNotFound extends NotFoundError {
  constructor(name: string) {
    super(`Tenant "${name}" not found`, 'tenant.not_found');
  }
}

export { TenantNotFound };
