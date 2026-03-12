import type { TenantRoutingRepository } from './TenantRoutingRepository.js';

class IndexNameResolver {
  constructor(private readonly repository: TenantRoutingRepository) {}

  async resolve(aliasName: string, tenantId: string): Promise<string> {
    const route = await this.repository.findRoute(tenantId, aliasName);
    const resolved = route ?? aliasName;

    return resolved;
  }

  invalidate(_tenantId: string, _aliasName: string): void {
    // Todo: Remove caching using repository.
  }
}

export { IndexNameResolver };
