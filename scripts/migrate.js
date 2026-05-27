import { DB } from '#api/odm/index.js';
import { runMigration } from '#api/migrations/migrate.js';

const MIGRATION_RESULT_PREFIX = '__UWAZI_MIGRATE_RESULT__=';

process.on('unhandledRejection', error => {
  throw error;
});

runMigration()
  .then(result => {
    process.stdout.write(`${MIGRATION_RESULT_PREFIX}${JSON.stringify(result)}\n`);
  })
  .catch(async e => {
    await DB.disconnect();
    throw e;
  });
