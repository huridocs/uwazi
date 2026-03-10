import { CSVLoader } from 'api/csv';
import { DB } from 'api/odm';
import users from 'api/users/users';
import { prettifyError } from 'api/utils/handleError';
import { tenants } from 'api/tenants/tenantContext';

const { template, importThesauri, username, language, file, stop } = require('yargs') // eslint-disable-line
  .option('template', {
    alias: 't',
    describe: '_id of a template or thesauri',
  })
  .option('importThesauri', {
    alias: 'T',
    describe: 'flag to import a thesauri csv instead of entities',
    type: 'boolean',
    default: false,
  })
  .option('file', {
    alias: 'f',
    describe: 'path to the csv file to import',
  })
  .option('username', {
    alias: 'u',
    describe: 'user to be assigned to imported entities',
    default: 'admin',
  })
  .option('language', {
    alias: 'l',
    describe: 'language to be used for the import',
    default: 'en',
  })
  .option('stop', {
    alias: 's',
    describe: 'stop when there is an error',
    type: 'boolean',
    default: false,
  })
  .demandOption(['template', 'file'], '\n\n').argv;

const loader = new CSVLoader({ stopOnError: stop });

if (importThesauri) {
  DB.connect()
    .then(() => tenants.run(async () => loader.loadThesauri(file, template, { language })))
    .then(() => {
      process.stdout.write(' 🎉 imported thesauri succesfully\n');
      process.stdout.write('\n\n');
      DB.disconnect();
    })
    .catch(e => {
      const error = prettifyError(e);
      process.stdout.write('\n\n');
      process.stdout.write('There was an error and importation stoped !!\n');
      process.stdout.write(error.message);
      process.stdout.write('\n');
      if (error.validations) {
        process.stdout.write(JSON.stringify(error.validations, null, ' '));
      }
      process.stdout.write('\n\n');
      DB.disconnect();
    });
} else {
  let loaded = 0;
  let errors = 0;

  loader.on('entityLoaded', () => {
    loaded += 1;
    process.stdout.write(`imported ${loaded} entities ...\r`);
  });

  loader.on('loadError', (error, entity, index) => {
    errors += 1;
    process.stdout.write(`\n an error ocurred importing entity number ${index} ${entity.title} =>`);
    process.stdout.write(`\n ${error} \n`);
  });

  process.stdout.write('\n');

  DB.connect().then(() =>
    tenants
      .run(async () => {
        const [user] = await users.get({ username });
        await loader.load(file, template, { language, user });
      })
      .then(() => {
        process.stdout.write(` 🎉 imported ${loaded} entities succesfully\n`);
        process.stdout.write('\n\n');
        DB.disconnect();
      })
      .catch(e => {
        DB.disconnect();
        process.stdout.write('\n\n');
        if (stop) {
          process.stdout.write('There was an error and importation stoped !!\n');
          process.stdout.write(e.message);
          process.stdout.write(e.stack || '');
        }

        if (!stop) {
          process.stdout.write(` 🎉 imported ${loaded} entities succesfully\n`);
          process.stdout.write(` ‼ ${errors} entities had errors and were not imported\n`);
        }
        process.stdout.write('\n\n');
      })
  );
}
