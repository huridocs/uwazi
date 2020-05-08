import { DB } from 'api/odm';
import { tenants } from 'api/odm/tenantContext';
import vaultSync from 'api/evidences_vault';

const { template, auth_token } = require('yargs') // eslint-disable-line
  .option('template', {
    alias: 't',
    describe: '_id of a template',
  })
  .option('auth_token', {
    alias: 'a',
    describe: 'authorization token',
  })
  .demandOption(['template', 'auth_token'], '\n\n').argv;

DB.connect()
  .then(() => tenants.run(async () => vaultSync.sync(auth_token, template)))
  .then(() => {
    process.stdout.write(' 🎉 imported evidences succesfully\n');
    process.stdout.write('\n\n');
    DB.disconnect();
  })
  .catch(e => {
    DB.disconnect();
    process.stdout.write('\n\n');
    process.stdout.write('There was an error and importation stoped !!\n');
    process.stdout.write(e.message);
    process.stdout.write(e.stack || '');
    process.stdout.write('\n\n');
  });
