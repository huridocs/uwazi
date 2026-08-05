import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { CSVLoader } from '#api/csv/index.js';
import { DB } from '#api/odm/index.js';
import { prettifyError } from '#api/utils/handleError.js';
import { tenants } from '#api/tenants/tenantContext.js';

const { template, importThesauri, language, file, stop } = await yargs(hideBin(process.argv))
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
  process.stdout.write(
    'Entities CSV import v1 has been removed. Use the /api/csvImportEntities v2 flow instead.\n'
  );
  process.exitCode = 1;
}
