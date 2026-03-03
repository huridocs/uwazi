import { DB } from '#api/odm/index.js';
import { runMigration } from '#api/migrations/migrate.js';

process.on('unhandledRejection', error => {
  throw error;
});

runMigration().catch(async e => {
  await DB.disconnect();
  throw e;
});
