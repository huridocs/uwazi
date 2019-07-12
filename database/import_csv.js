import CSVLoader from 'api/csv';
import connect, { disconnect } from 'api/utils/connect_to_mongo';
import users from 'api/users/users';

const { template, importThesauri, username, language, file, stop } = require('yargs') // eslint-disable-line
.option('template', {
  alias: 't',
  describe: '_id of a template or thesauri',
})
.option('importThesauri', {
  alias: 'T',
  describe: 'flag to imprt a thesauri csv instead of entities',
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
.demandOption(['template', 'file'], '\n\n')
.argv;

const loader = new CSVLoader({ stopOnError: stop });

if (importThesauri) {
  connect()
  .then(() => loader.loadThesauri(file, template, { language }))
  .then(() => {
    process.stdout.write(' 🎉 imported thesauri succesfully\n');
    process.stdout.write('\n\n');
    disconnect();
  })
  .catch((e) => {
    disconnect();
    process.stdout.write('\n\n');
    process.stdout.write('There was an error and importation stoped !!\n');
    process.stdout.write(e.message);
    process.stdout.write(e.stack);
    process.stdout.write('\n\n');
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

  connect()
  .then(() => users.get({ username }))
  .then(([user]) => loader.load(file, template, { language, user }))
  .then(() => {
    process.stdout.write(` 🎉 imported ${loaded} entities succesfully\n`);
    process.stdout.write('\n\n');
    disconnect();
  })
  .catch((e) => {
    disconnect();
    process.stdout.write('\n\n');
    if (stop) {
      process.stdout.write('There was an error and importation stoped !!\n');
      process.stdout.write(e.message);
      process.stdout.write(e.stack);
    }

    if (!stop) {
      process.stdout.write(` 🎉 imported ${loaded} entities succesfully\n`);
      process.stdout.write(` ‼ ${errors} entities had errors and were not imported\n`);
    }
    process.stdout.write('\n\n');
  });
}
