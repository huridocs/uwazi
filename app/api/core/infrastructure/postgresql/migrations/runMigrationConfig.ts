import { Db } from 'mongodb';
import {
  AnyMigrationConfig,
  MigrateCollectionToPostgres,
  MigrateOptions,
} from './MigrateCollectionToPostgres.js';

type MigrationCopy = (
  mongoDb: Db,
  tenantId: string,
  options?: MigrateOptions
) => Promise<{ migrated: number; orphansSkipped: number; skipped: boolean }>;

const ownCopy = (migration: AnyMigrationConfig): MigrationCopy | undefined => {
  if (!('copy' in migration)) {
    return undefined;
  }
  const { copy } = migration as AnyMigrationConfig & { copy?: MigrationCopy };
  return typeof copy === 'function' ? copy : undefined;
};

type RunMigrationArgs = {
  mongoDb: Db;
  tenantId: string;
  migration: AnyMigrationConfig;
  options?: MigrateOptions;
};

/**
 * Runs a collection copy. A config may bring its own `copy` when the shared
 * inserter cannot express that collection's rows.
 */
const runMigrationConfig = async ({
  mongoDb,
  tenantId,
  migration,
  options = {},
}: RunMigrationArgs): Promise<{ migrated: number; orphansSkipped: number; skipped: boolean }> => {
  const copy = ownCopy(migration);
  if (copy) {
    return copy(mongoDb, tenantId, options);
  }
  return new MigrateCollectionToPostgres(mongoDb, tenantId).migrate(migration, options);
};

export { runMigrationConfig };
