import type { TenantsDataSource } from './contracts/TenantsDataSource.js';
import { TenantStorageTaken } from './TenantStorageTaken.js';

type Claim = { dbName?: string; indexName?: string };

/**
 * Keeps every tenant on its own database and index. Shared by the use cases that can set them;
 * Postgres also enforces it with unique indexes, Mongo only through here.
 */
class TenantStorageClaims {
  constructor(private readonly tenants: TenantsDataSource) {}

  async ensureFree(name: string, { dbName, indexName }: Claim): Promise<void> {
    const others = (await this.tenants.all()).filter(tenant => tenant.name !== name);

    const sharesDb = dbName !== undefined && others.find(tenant => tenant.dbName === dbName);
    if (sharesDb) {
      throw new TenantStorageTaken('database', dbName, sharesDb.name);
    }

    const sharesIndex =
      indexName !== undefined && others.find(tenant => tenant.indexName === indexName);
    if (sharesIndex) {
      throw new TenantStorageTaken('index', indexName, sharesIndex.name);
    }
  }
}

export { TenantStorageClaims };
