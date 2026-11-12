import { Db, Long } from 'mongodb';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import {
  ARCHIVED_JSONB_COLUMNS,
  ARCHIVED_TENANT_RECORD_COLUMNS,
} from '#api/tenants/infrastructure/archivedTenantsTable.js';
import type { CopyResult } from './copyHttpSessions.js';

const BATCH_SIZE = 50;

/** Mongo bookkeeping that means nothing in Postgres. */
const INTERNAL_KEYS = ['_id'];

const COLUMNS: readonly string[] = ARCHIVED_TENANT_RECORD_COLUMNS;
const JSON_COLUMNS: readonly string[] = ARCHIVED_JSONB_COLUMNS;

type MongoArchivedDocument = Record<string, unknown> & { name: string };

/** A BSON long is stored as the number it holds; everything else is left as it is. */
const plain = (value: unknown): unknown => {
  if (value instanceof Long) return value.toNumber();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, plain(entry)]));
  }
  return value;
};

/** `archivedAt` reaches Mongo as a number or a numeric string; unreadable/missing becomes NULL. */
const toArchivedAt = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
};

/**
 * The archived snapshot is a fixed whitelist, so keys outside the declared columns are dropped on
 * purpose, not preserved in an `extras` column.
 */
const toRow = (doc: MongoArchivedDocument): Record<string, unknown> => {
  const entries = Object.entries(doc).filter(([key]) => !INTERNAL_KEYS.includes(key));
  const known = entries.filter(([key]) => COLUMNS.includes(key));

  return Object.fromEntries(
    known.map(([key, value]) => {
      if (key === 'archivedAt') {
        return [key, toArchivedAt(plain(value))];
      }
      return [key, JSON_COLUMNS.includes(key) ? JSON.stringify(plain(value)) : value];
    })
  );
};

const insertBatch = async (batch: Record<string, unknown>[]): Promise<number> => {
  const inserted: { name: string }[] = await PostgresDB.knex('archived_tenants')
    .insert(batch)
    .onConflict('name')
    .ignore()
    .returning('name');
  return inserted.length;
};

/**
 * One pass over the shared Mongo `archives` collection into `archived_tenants`. Rows already
 * stored are left as they are.
 */
const copyArchivedTenants = async (sharedDb: Db): Promise<CopyResult> => {
  const documents = await sharedDb
    .collection<MongoArchivedDocument>('archives')
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

export { copyArchivedTenants };
