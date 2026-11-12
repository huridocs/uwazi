import { TenantNotFound } from '#api/tenants/application/errors.js';
import { TenantsDataSourceFactory } from '#api/tenants/infrastructure/TenantsDataSourceFactory.js';
import { ArchivedTenantsDataSourceFactory } from '#api/tenants/infrastructure/ArchivedTenantsDataSourceFactory.js';
import { toArchivedRecord, type DumpLocation } from '../archived/archivedRecord.js';
import type { TenantOutput } from '../contracts.js';

type ArchiveTenantInput = { name: string; dumpLocation: DumpLocation };

/**
 * Moves a tenant from the active registry to the archived registry, on the backend `TENANTS_BACKEND`
 * selects. The data dump it records in `dumpLocation` was produced before this runs, by the archive
 * playbook; this command only moves the registry row.
 */
class ArchiveTenantController {
  static async handle({ name, dumpLocation }: ArchiveTenantInput): Promise<TenantOutput> {
    const tenants = TenantsDataSourceFactory.default();
    const archived = ArchivedTenantsDataSourceFactory.default();

    const tenant = await tenants.getByName(name);
    if (!tenant) {
      throw new TenantNotFound(name);
    }

    const archivedAt = Math.floor(Date.now() / 1000);
    const stored = await archived.upsert(name, toArchivedRecord(tenant, dumpLocation, archivedAt));
    await tenants.delete(name);

    return stored;
  }
}

export { ArchiveTenantController };
