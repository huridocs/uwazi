import type { TenantNameInput } from '#api/tenants/application/tenantInputs.js';
import { TenantConflict } from '#api/tenants/application/TenantConflict.js';
import { TenantNotFound } from '#api/tenants/application/errors.js';
import { TenantStorageClaims } from '#api/tenants/application/TenantStorageClaims.js';
import type { ArchivedTenantRecord } from '#api/tenants/application/contracts/ArchivedTenantsDataSource.js';
import type { TenantsDataSource } from '#api/tenants/application/contracts/TenantsDataSource.js';
import { TenantsDataSourceFactory } from '#api/tenants/infrastructure/TenantsDataSourceFactory.js';
import { ArchivedTenantsDataSourceFactory } from '#api/tenants/infrastructure/ArchivedTenantsDataSourceFactory.js';
import { toActiveRecord } from '../archived/archivedRecord.js';
import type { TenantOutput } from '../contracts.js';

/**
 * Moves a tenant back from the archived registry into the active registry, rebuilding a clean row
 * from the snapshot. Refuses to overwrite a tenant that is already active, or to put the tenant
 * on a database or index another tenant has taken since it was archived.
 */
class UnarchiveTenantController {
  static async handle({ name }: TenantNameInput): Promise<TenantOutput> {
    const tenants = TenantsDataSourceFactory.default();
    const archived = ArchivedTenantsDataSourceFactory.default();

    const archivedRow = await archived.getByName(name);
    if (!archivedRow) {
      throw new TenantNotFound(name);
    }

    await UnarchiveTenantController.assertRestorable(tenants, name, archivedRow);

    const stored = await tenants.upsert(name, toActiveRecord(archivedRow));
    await archived.delete(name);

    return stored;
  }

  /** Both guards before the write: an active name must not be clobbered, and neither may its
   * database or index be shared with another active tenant. */
  private static async assertRestorable(
    tenants: TenantsDataSource,
    name: string,
    archivedRow: ArchivedTenantRecord
  ): Promise<void> {
    if (await tenants.getByName(name)) {
      throw new TenantConflict(name);
    }

    await new TenantStorageClaims(tenants).ensureFree(name, {
      dbName: typeof archivedRow.dbName === 'string' ? archivedRow.dbName : undefined,
      indexName: typeof archivedRow.indexName === 'string' ? archivedRow.indexName : undefined,
    });
  }
}

export { UnarchiveTenantController };
