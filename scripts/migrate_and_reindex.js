import { DB } from '#api/odm/index.js';
import { runMigration } from '#api/migrations/migrate.js';

process.on('unhandledRejection', error => {
  throw error;
});

process.stdout.write('Starting migrations...\r\n');
runMigration()
  .then(async result => {
    if (result.reindex) {
      await import('../database/reindex_elastic.js');
    }
  })
  .catch(async e => {
    await DB.disconnect();
    throw e;
  });
