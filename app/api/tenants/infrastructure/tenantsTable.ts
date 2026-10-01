import { TENANT_FIELDS } from '../tenant.js';
import type { TenantRecord } from '../application/contracts/TenantsDataSource.js';

/** Every column that mirrors a field of the stored record, named as the Mongo field is. */
const TENANT_RECORD_COLUMNS = [...TENANT_FIELDS, 'stats', 'healthChecks', 'metadata'] as const;

type TenantColumn = (typeof TENANT_RECORD_COLUMNS)[number];

/** The columns holding structured values, which `pg` cannot be trusted to serialise. */
const JSONB_COLUMNS: readonly TenantColumn[] = [
  'featureFlags',
  'globalMatomo',
  'stats',
  'healthChecks',
  'metadata',
];

/** How a row is stored: absent fields are `NULL`, and there is bookkeeping the record hides. */
type TenantRow = { name: string } & {
  [K in Exclude<TenantColumn, 'name'>]: Required<TenantRecord>[K] | null;
} & {
  extras: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export { JSONB_COLUMNS, TENANT_RECORD_COLUMNS };
export type { TenantColumn, TenantRow };
