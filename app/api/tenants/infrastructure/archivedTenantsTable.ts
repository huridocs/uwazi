import type { TenantRecord } from '../application/contracts/TenantsDataSource.js';

/** The tenant-row fields an archived snapshot keeps. Everything else is dropped on archive. */
const ARCHIVED_TENANT_SNAPSHOT_FIELDS = [
  'name',
  'dbName',
  'indexName',
  'uploadedDocuments',
  'attachments',
  'customUploads',
  'activityLogs',
  'featureFlags',
] as const satisfies readonly (keyof TenantRecord)[];

/** Columns the archived record adds on top of the tenant snapshot. */
const ARCHIVE_ONLY_COLUMNS = ['status', 'dumpLocation', 'archivedAt'] as const;

/** Every column that mirrors a field of the archived record, named as the Mongo field is. */
const ARCHIVED_TENANT_RECORD_COLUMNS = [
  ...ARCHIVED_TENANT_SNAPSHOT_FIELDS,
  ...ARCHIVE_ONLY_COLUMNS,
] as const;

type ArchivedTenantColumn = (typeof ARCHIVED_TENANT_RECORD_COLUMNS)[number];

/** Columns holding structured values, which `pg` cannot be trusted to serialise. */
const ARCHIVED_JSONB_COLUMNS: readonly ArchivedTenantColumn[] = ['featureFlags', 'dumpLocation'];

export { ARCHIVED_JSONB_COLUMNS, ARCHIVED_TENANT_RECORD_COLUMNS, ARCHIVED_TENANT_SNAPSHOT_FIELDS };
export type { ArchivedTenantColumn };
