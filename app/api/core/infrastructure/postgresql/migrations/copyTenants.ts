import { Db, Long } from 'mongodb';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { JSONB_COLUMNS, TENANT_RECORD_COLUMNS } from '#api/tenants/infrastructure/tenantsTable.js';
import type { CopyResult } from './copyHttpSessions.js';

const BATCH_SIZE = 50;

/** Mongo bookkeeping that means nothing in Postgres. */
const INTERNAL_KEYS = ['_id', '__v'];

const COLUMNS: readonly string[] = TENANT_RECORD_COLUMNS;
const JSON_COLUMNS: readonly string[] = JSONB_COLUMNS;

type MongoTenantDocument = Record<string, unknown> & { name: string };

/** A BSON long is stored as the number it holds; everything else is left as it is. */
const plain = (value: unknown): unknown => {
  if (value instanceof Long) return value.toNumber();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, plain(entry)]));
  }
  return value;
};

const toRow = (doc: MongoTenantDocument): Record<string, unknown> => {
  const entries = Object.entries(doc).filter(([key]) => !INTERNAL_KEYS.includes(key));
  const known = entries.filter(([key]) => COLUMNS.includes(key));
  const extras = entries.filter(([key]) => !COLUMNS.includes(key));

  return {
    ...Object.fromEntries(
      known.map(([key, value]) => [
        key,
        JSON_COLUMNS.includes(key) ? JSON.stringify(plain(value)) : value,
      ])
    ),
    extras: JSON.stringify(plain(Object.fromEntries(extras))),
  };
};

const insertBatch = async (batch: Record<string, unknown>[]): Promise<number> => {
  const inserted: { name: string }[] = await PostgresDB.knex('tenants')
    .insert(batch)
    .onConflict('name')
    .ignore()
    .returning('name');
  return inserted.length;
};

/**
 * One pass over the shared Mongo `tenants` collection into the `tenants` table. The collection is
 * read raw, not through the data source, so the keys uwazi does not declare reach `extras`. Rows
 * already stored are left as they are.
 */
const copyTenants = async (sharedDb: Db): Promise<CopyResult> => {
  const documents = await sharedDb
    .collection<MongoTenantDocument>('tenants')
    .find({})
    .sort({ name: 1 })
    .toArray();
  const rows = documents.map(toRow);
  const batches = Array.from({ length: Math.ceil(rows.length / BATCH_SIZE) }, (_, index) =>
    rows.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE)
  );

  const copied = await batches.reduce(
    async (total, batch) => (await total) + (await insertBatch(batch)),
    Promise.resolve(0)
  );

  return { copied, alreadyPresent: rows.length - copied };
};

export { copyTenants };
