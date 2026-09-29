import { DomainError } from '#api/core/domain/error/DomainError.js';

class TenantDomainMissing extends DomainError {
  constructor(tenant: string) {
    super(`Tenant "${tenant}" has no domain configured`, 'tenant.domain_missing');
  }
}

export { TenantDomainMissing };
