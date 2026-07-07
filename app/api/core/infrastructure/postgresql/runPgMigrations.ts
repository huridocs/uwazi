import path from 'path';
import { fileURLToPath } from 'url';
import { PgMigrator } from './PgMigrator.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'schema_migrations');

async function main() {
  const args = process.argv.slice(2);
  const showStatus = args.includes('--status');

  PostgresDB.connect();
  const pool = PostgresDB.pool();

  try {
    const migrator = new PgMigrator(MIGRATIONS_DIR, pool);

    if (showStatus) {
      const { applied, pending } = await migrator.status();

      if (applied.length > 0) {
        process.stdout.write(`Applied migrations (${applied.length}):\n`);
        applied.forEach(m => process.stdout.write(`  ${m.delta}: ${m.name}\n`));
      } else {
        process.stdout.write('No migrations applied yet.\n');
      }

      if (pending.length > 0) {
        process.stdout.write(`\nPending migrations (${pending.length}):\n`);
        pending.forEach(m => process.stdout.write(`  ${m.delta}: ${m.name}\n`));
      } else {
        process.stdout.write('\nNo pending migrations.\n');
      }
    } else {
      const { pending: pendingBefore } = await migrator.status();
      const applied = await migrator.migrate();

      if (applied.length === 0) {
        process.stdout.write('No pending migrations.\n');
      } else {
        applied.forEach(delta => {
          const migration = pendingBefore.find(m => m.delta === delta);
          if (migration) {
            process.stdout.write(`Applied migration ${migration.delta}: ${migration.name}\n`);
          }
        });
        process.stdout.write(`\nSuccessfully applied ${applied.length} migration(s).\n`);
      }
    }
  } finally {
    await PostgresDB.disconnect();
  }
}

main().catch(err => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
