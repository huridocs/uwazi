import { DB } from '../app/api/odm';
import { runMigration } from '../app/api/migrations/migrate';

process.on('unhandledRejection', error => {
  throw error;
});

process.stdout.write('Starting migrations...\r\n');
runMigration()
  .then(result => {
    if (result.reindex) {
      // eslint-disable-next-line import/no-dynamic-require,global-require
      require(`${__dirname}/../database/reindex_elastic.js`);
    }
  })
  .catch(async e => {
    await DB.disconnect();
    throw e;
  });
