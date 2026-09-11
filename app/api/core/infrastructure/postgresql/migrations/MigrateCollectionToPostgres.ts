import { Db } from 'mongodb';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { PostgresTable } from '../common/PostgresTable.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';

const BATCH_SIZE = 50;

interface MigrationConfig {
  mongoCollection: string;
  pgTable: string;
  mapDocument(doc: Record<string, unknown>): Record<string, unknown>;
  /**
   * Skip documents whose `field` is not the `_id` of a document in `collection`, which a
   * foreign key on the Postgres table would reject. Skipped documents are counted, not migrated.
   */
  excludeOrphansOf?: { field: string; collection: string };
}

/** For collections where one mongo document becomes several postgres rows. */
interface RowsMigrationConfig {
  mongoCollection: string;
  pgTable: string;
  mapRows(doc: Record<string, unknown>): Record<string, unknown>[];
}

type AnyMigrationConfig = MigrationConfig | RowsMigrationConfig;

type MigrateOptions = {
  /**
   * Migrate even when the PostgreSQL table already contains rows for the
   * tenant. Existing rows are left untouched; conflicting rows are ignored.
   */
  force?: boolean;
};

const rowsMapperOf = (
  config: AnyMigrationConfig
): ((doc: Record<string, unknown>) => Record<string, unknown>[]) =>
  'mapRows' in config ? doc => config.mapRows(doc) : doc => [config.mapDocument(doc)];

const SYSTEM_PERMISSION_CONTEXT = { bypass: true, refIds: [] as string[] };

const serializeRow = (row: Record<string, unknown>): Record<string, unknown> => {
  const serialized = { ...row };
  for (const key of Object.keys(serialized)) {
    const value = serialized[key];
    if (typeof value === 'object' && value !== null) {
      serialized[key] = JSON.stringify(value);
    }
  }
  return serialized;
};

const insertBatch = async (
  table: PostgresTable,
  batch: Record<string, unknown>[],
  force: boolean
): Promise<void> => {
  if (!batch.length) {
    return;
  }
  const rows = batch.map(row => serializeRow({ ...row, tenant_id: table.tenantId }));
  try {
    await table.transactionManager.withConnection(async trx => {
      if (force) {
        await trx(table.tableName).insert(rows).onConflict(['_id', 'tenant_id']).ignore();
      } else {
        await trx(table.tableName).insert(rows);
      }
    }, SYSTEM_PERMISSION_CONTEXT);
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(
      '[MigrateCollectionToPostgres] Insert failed for batch:',
      JSON.stringify(batch, null, 2)
    );
    throw err;
  }
};

const flushBatch = async (
  table: PostgresTable,
  batch: Record<string, unknown>[],
  force: boolean
): Promise<Record<string, unknown>[]> => {
  await insertBatch(table, batch, force);
  return [];
};

/** The rows a document becomes, or none when it is an orphan; counts it either way. */
const rowsToMigrate = (
  doc: Record<string, unknown>,
  options: {
    mapRows: (doc: Record<string, unknown>) => Record<string, unknown>[];
    isOrphan: (doc: Record<string, unknown>) => boolean;
  },
  counts: { migrated: number; orphansSkipped: number }
): Record<string, unknown>[] => {
  if (options.isOrphan(doc)) {
    counts.orphansSkipped += 1;
    return [];
  }
  counts.migrated += 1;
  return options.mapRows(doc);
};

class MigrateCollectionToPostgres {
  constructor(
    private mongoDb: Db,
    private tenantId: string
  ) {}

  /** Parent `_id`s are read once per run and compared as hex strings. */
  private async orphanCheckFor(
    config: AnyMigrationConfig
  ): Promise<(doc: Record<string, unknown>) => boolean> {
    if (!('excludeOrphansOf' in config) || !config.excludeOrphansOf) {
      return () => false;
    }

    const { field, collection } = config.excludeOrphansOf;
    const parentIds = new Set(
      await this.mongoDb
        .collection(collection)
        .find({}, { projection: { _id: 1 } })
        .map(parent => String(parent._id))
        .toArray()
    );
    return doc => !parentIds.has(String(doc[field]));
  }

  private async fetchAndInsert(
    config: AnyMigrationConfig,
    table: PostgresTable,
    options: {
      mapRows: (doc: Record<string, unknown>) => Record<string, unknown>[];
      isOrphan: (doc: Record<string, unknown>) => boolean;
      force: boolean;
    }
  ): Promise<{ migrated: number; orphansSkipped: number }> {
    const cursor = this.mongoDb
      .collection<Record<string, unknown>>(config.mongoCollection)
      .find({})
      .batchSize(BATCH_SIZE);

    const counts = { migrated: 0, orphansSkipped: 0 };
    let batch: Record<string, unknown>[] = [];

    for await (const doc of cursor) {
      batch.push(...rowsToMigrate(doc, options, counts));
      if (batch.length >= BATCH_SIZE) {
        batch = await flushBatch(table, batch, options.force);
      }
    }

    await insertBatch(table, batch, options.force);
    return counts;
  }

  async migrate(
    config: AnyMigrationConfig,
    options: MigrateOptions = {}
  ): Promise<{ migrated: number; orphansSkipped: number; skipped: boolean }> {
    const pgTransactionManager = new PostgresTransactionManager(
      PostgresDB.knex,
      this.tenantId,
      LoggerFactory.systemLogger()
    );
    const table = PostgresTable.for({
      tableName: config.pgTable,
      tenantId: this.tenantId,
      transactionManager: pgTransactionManager,
    });

    if (!options.force) {
      const existingRow = await table.first();

      if (existingRow !== undefined) {
        return { migrated: 0, orphansSkipped: 0, skipped: true };
      }
    }

    const counts = await this.fetchAndInsert(config, table, {
      mapRows: rowsMapperOf(config),
      isOrphan: await this.orphanCheckFor(config),
      force: options.force ?? false,
    });
    return { ...counts, skipped: false };
  }
}

export type { AnyMigrationConfig, MigrateOptions, MigrationConfig, RowsMigrationConfig };
export { BATCH_SIZE, MigrateCollectionToPostgres };
