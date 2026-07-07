import { DB } from '#api/odm/index.js';
import { runMigration } from '#api/migrations/migrate.js';

const MIGRATION_RESULT_PREFIX = '__UWAZI_MIGRATE_RESULT__=';

process.on('unhandledRejection', error => {
  throw error;
});

runMigration()
  .then(result => {
    process.stdout.write(`${MIGRATION_RESULT_PREFIX}${JSON.stringify(result)}\n`);
    if (result.blocked) {
      process.exitCode = 1;
    }
  })
  .catch(async e => {
    process.stderr.write(`${MIGRATION_RESULT_PREFIX}${JSON.stringify({ error: e.message })}\n`);
    await DB.disconnect();
    process.exit(1);
  });
