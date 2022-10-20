const mongodb = require('mongodb');
const yargs = require('yargs');
// eslint-disable-next-line import/no-extraneous-dependencies
const fetch = require('node-fetch');
const csvtojson = require('csvtojson');
const _ = require('lodash');

const getClient = async () => {
  const url = process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://localhost/';
  const client = new mongodb.MongoClient(url, { useUnifiedTopology: true });
  await client.connect();

  return client;
};

const getTranslationsFromDB = async () => {
  const client = await getClient();
  const db = client.db(process.env.DATABASE_NAME || 'uwazi_development');
  const collection = db.collection('translations');
  const [firstTranslation] = await collection.find().toArray();
  const systemContext = firstTranslation.contexts.find(c => c.id === 'System');
  client.close();
  return systemContext.values;
};

const getKeysFromRepository = async locale => {
  const url = `https://api.github.com/repos/huridocs/uwazi-contents/contents/ui-translations/${locale}.csv`;

  const response = await fetch(url, {
    headers: {
      accept: 'application/vnd.github.v4.raw',
    },
  });
  const fileContent = await response.text();
  const repoTranslations = await csvtojson({
    delimiter: [',', ';'],
    quote: '"',
    headers: ['key', 'value'],
  }).fromString(fileContent);

  return repoTranslations;
};

const reportResult = (keys, message) => {
  keys.forEach(text => {
    process.stdout.write(`\x1b[36m ${text} \n`);
  });

  process.stdout.write(` === Found \x1b[31m ${keys.length} \x1b[0m ${message} === \n`);
};

const reportUntraslated = translations => {
  translations.forEach(({ key, value }) => {
    process.stdout.write(`\x1b[36m ${key}\x1b[37m ${value} \n`);
  });

  process.stdout.write(
    ` === Found \x1b[31m ${translations.length} \x1b[0m possible untranslated === \n`
  );
};

// eslint-disable-next-line max-statements
async function compareTranslations(locale) {
  try {
    const dbTranslations = await getTranslationsFromDB();
    const keysFromDB = dbTranslations.map(translation => translation.key);
    const valuesFromDB = dbTranslations.map(translation => translation.value);
    const repositoryTranslations = await getKeysFromRepository(locale);
    const keysInRepository = repositoryTranslations.map(translation => translation.key);
    const valuesInRepository = repositoryTranslations.map(translation => translation.value);
    const unTranslatedValues = _.intersection(valuesFromDB, valuesInRepository);
    const unTranslated = repositoryTranslations.filter(translation =>
      unTranslatedValues.includes(translation.value)
    );

    const obsoleteTranslations = _.difference(keysInRepository, keysFromDB);
    const missingTranslations = _.difference(keysFromDB, keysInRepository);

    reportResult(obsoleteTranslations, 'possible obsolete translations in the repository');
    reportResult(missingTranslations, 'missing keys in the repository');
    reportUntraslated(unTranslated);

    if (obsoleteTranslations.length > 0 || missingTranslations.length > 0 || unTranslated.length) {
      process.exit(1);
    } else {
      process.stdout.write('\x1b[32m All good! \x1b[0m\n');
      process.exit(0);
    }
  } catch (e) {
    process.stdout.write(' === An error occurred === \n');
  }
}

yargs.parse();

const { argv } = yargs;
yargs.command(
  'compareTranslations',
  'compare translation between DB and Github Repository',
  {
    locale: {
      alias: 't',
      type: 'string',
    },
  },
  () =>
    new Promise(resolve => {
      setTimeout(async () => {
        await compareTranslations(argv.locale);
        resolve();
      }, 3000);
    })
);

yargs.parse('compareTranslations');
