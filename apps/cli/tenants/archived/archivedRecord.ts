import type { ArchivedTenantRecord } from '#api/tenants/application/contracts/ArchivedTenantsDataSource.js';
import type {
  TenantPatch,
  TenantRecord,
} from '#api/tenants/application/contracts/TenantsDataSource.js';
import { ARCHIVED_TENANT_SNAPSHOT_FIELDS } from '#api/tenants/infrastructure/archivedTenantsTable.js';

type DumpLocation = { db: string; files: string };

/** The fixed snapshot written to the archived registry, whichever backend `TENANTS_BACKEND` picks. */
const toArchivedRecord = (
  tenant: TenantRecord,
  dumpLocation: DumpLocation,
  archivedAt: number
): ArchivedTenantRecord => {
  const record: Record<string, unknown> = { status: 'archived', dumpLocation, archivedAt };

  ARCHIVED_TENANT_SNAPSHOT_FIELDS.forEach(field => {
    const value = tenant[field];
    if (value !== undefined) record[field] = value;
  });

  return record;
};

/** The patch that rebuilds a clean active row: the snapshot fields, none of the archive-only or
 * stray fields, and no `name` — the caller passes the name to `upsert` separately. */
const toActiveRecord = (archivedRow: ArchivedTenantRecord): TenantPatch => {
  const patch: Record<string, unknown> = {};

  ARCHIVED_TENANT_SNAPSHOT_FIELDS.forEach(field => {
    if (field === 'name') return;
    const value = archivedRow[field];
    if (value !== undefined) patch[field] = value;
  });

  return patch as TenantPatch;
};

export { toActiveRecord, toArchivedRecord };
export type { DumpLocation };
