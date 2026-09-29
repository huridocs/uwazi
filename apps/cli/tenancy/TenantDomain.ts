import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TenantDomainMissing } from './TenantDomainMissing.js';

/**
 * The current tenant's public URL, as Uwazi itself builds it for emails. The CLI has no
 * request to take a protocol from, so it is always https.
 */
class TenantDomain {
  static url(): string {
    const { name, domain } = ExecutionContext.tenant;

    if (!domain) {
      throw new TenantDomainMissing(name);
    }

    return `https://${domain}`;
  }
}

export { TenantDomain };
