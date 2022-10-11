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

const getKeysFromDB = async () => {
  const client = await getClient();
  const db = client.db(process.env.DATABASE_NAME || 'uwazi_development');
  const collection = db.collection('translations');
  const [firstTranslation] = await collection.find().toArray();
  const systemContext = firstTranslation.contexts.find(c => c.id === 'System');
  client.close();
  return systemContext.values.map(translation => translation.key);
};

const getKeysFromRepository = async locale => {
  const url = `https://raw.githubusercontent.com/huridocs/uwazi-contents/3605-tooltips-changes/ui-translations/${locale}.csv`;
  const response = await fetch(url, {
    headers: {
      accept: 'application/vnd.github.v4.raw',
    },
  });
  const fileContent = await response.text();
  const repoTranslations = await csvtojson({ delimiter: [',', ';'], quote: '"' }).fromString(
    fileContent
  );

  return repoTranslations.map(translation => translation.Key);
};

const reportResult = (keys, message) => {
  keys.forEach(text => {
    process.stdout.write(`\x1b[36m ${text} \n`);
  });

  process.stdout.write(` === Found \x1b[31m ${keys.length} \x1b[0m ${message} === \n`);
};
// eslint-disable-next-line max-statements
async function compareTranslations(locale) {
  try {
    const keysFromDB = await getKeysFromDB();
    const keysInRepository = await getKeysFromRepository(locale);
    const obsoleteTranslations = _.difference(keysInRepository, keysFromDB);
    const missingTranslations = _.difference(keysFromDB, keysInRepository);

    reportResult(obsoleteTranslations, 'posible obsolete translations in repository');
    reportResult(missingTranslations, 'missing keys in repository');

    if (obsoleteTranslations.length > 0 || missingTranslations.length > 0) {
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
