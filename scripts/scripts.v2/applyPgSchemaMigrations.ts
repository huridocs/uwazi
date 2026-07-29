/**
 * Applies pending PostgreSQL schema migrations (schema_migrations/*.sql).
 *
 * Used by `database/blank_state_base.sh` after restoring PG blank-state data and
 * before `yarn migrate`, so Mongo data migrations that declare `requiresSchema`
 * are not blocked on a fresh database (currentSchema would otherwise stay at 0).
 *
 * Invoked via: node scripts/runner.js scripts/scripts.v2/applyPgSchemaMigrations.ts
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PG_MIGRATIONS_DIR = path.resolve(
  __dirname,
  '../../app/api/core/infrastructure/postgresql/schema_migrations'
);

const run = async () => {
  const migrator = new PgMigrator(PG_MIGRATIONS_DIR, PostgresDB.adminPool());
  const applied = await migrator.migrate();
  const currentVersion = await migrator.getCurrentVersion();

  process.stdout.write(
    `Applied PostgreSQL schema migrations: [${applied.join(', ')}], current=${currentVersion}\n`
  );
  await PostgresDB.disconnect();
};

run().catch(async error => {
  process.stderr.write(`Failed to apply PostgreSQL schema migrations: ${error.message}\n`);
  await PostgresDB.disconnect();
  process.exit(1);
});
