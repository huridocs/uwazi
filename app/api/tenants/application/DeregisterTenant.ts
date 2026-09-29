import type { UseCase } from '#api/core/libs/UseCase.js';
import type { TenantsDataSource } from './contracts/TenantsDataSource.js';
import { TenantNotFound } from './errors.js';

/**
 * Removes the registry row only. The tenant's database, search index and files are infrastructure's
 * to remove — see plans/uwazi-cli-tenants.md.
 */
class DeregisterTenant implements UseCase<string, void> {
  constructor(private readonly tenants: TenantsDataSource) {}

  async execute(name: string): Promise<void> {
    if (!(await this.tenants.delete(name))) {
      throw new TenantNotFound(name);
    }
  }
}

export { DeregisterTenant };
