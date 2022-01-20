import { DB } from '../app/api/odm';
import { runMigration } from '../app/api/migrations/migrate';

process.on('unhandledRejection', error => {
  throw error;
});

runMigration().catch(async e => {
  await DB.disconnect();
  throw e;
});
