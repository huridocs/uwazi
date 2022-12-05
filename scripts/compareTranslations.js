const mongodb = require('mongodb');
const yargs = require('yargs');
// eslint-disable-next-line import/no-extraneous-dependencies
const fetch = require('node-fetch');
const csv = require('@fast-csv/format');
const fs = require('fs');
const path = require('path');
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

const getAvaiableLanguages = async () => {
  const url = 'https://api.github.com/repos/huridocs/uwazi-contents/contents/ui-translations';

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
    },
  });
  const languages = await response.json();
  return languages.map(language => language.name.replace('.csv', ''));
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

async function updatedTranslations(dbKeyValues, language) {
  // eslint-disable-next-line max-statements
  return new Promise(resolve => {
    const { locale, repositoryTranslations, obsoleteTranslations, missingTranslations } = language;
    const fileName = path.resolve(__dirname, `${locale}-${new Date().toISOString()}.csv`);
    const csvFile = fs.createWriteStream(fileName);
    const csvStream = csv.format({ headers: true });
    csvStream.pipe(csvFile).on('finish', csvFile.end);
    csvStream.write(['key', 'value']);

    const cleanedTranslations = repositoryTranslations.filter(
      t => !obsoleteTranslations.includes(t.key)
    );
    const addedTranslations = cleanedTranslations.concat(
      missingTranslations.map(t => ({ key: t, value: dbKeyValues[t] }))
    );
    const orderedTranslations = _.orderBy(addedTranslations, entry => entry.key.toLowerCase());
    orderedTranslations.forEach(row => {
      csvStream.write([row.key, row.value]);
    });
    csvStream.on('finish', resolve);
  });
}

async function processLanguage(keysFromDB, valuesFromDB, locale) {
  const repositoryTranslations = await getKeysFromRepository(locale);
  const keysInRepository = repositoryTranslations.map(translation => translation.key);
  const valuesInRepository = repositoryTranslations.map(translation => translation.value);
  const unTranslatedValues = _.intersection(valuesFromDB, valuesInRepository);
  const unTranslated = repositoryTranslations.filter(translation =>
    unTranslatedValues.includes(translation.value)
  );

  const obsoleteTranslations = _.difference(keysInRepository, keysFromDB);
  const missingTranslations = _.difference(keysFromDB, keysInRepository);
  return {
    locale,
    repositoryTranslations,
    obsoleteTranslations,
    missingTranslations,
    unTranslated,
  };
}
// eslint-disable-next-line max-statements
async function compareTranslations(locale, update) {
  try {
    const dbTranslations = await getTranslationsFromDB();
    const dbKeyValues = dbTranslations.reduce(
      (accum, translation) => ({
        ...accum,
        [translation.key]: translation.value,
      }),
      {}
    );
    const keysFromDB = Object.keys(dbKeyValues);
    const valuesFromDB = Object.values(dbKeyValues);

    const languages = locale ? [locale] : await getAvaiableLanguages();
    const result = await Promise.all(
      languages.map(language => processLanguage(keysFromDB, valuesFromDB, language))
    );

    if (result.length) {
      if (locale) {
        const [{ obsoleteTranslations, missingTranslations, unTranslated }] = result;
        reportResult(obsoleteTranslations, 'possible obsolete translations in the repository');
        reportResult(missingTranslations, 'missing keys in the repository');
        reportUntraslated(unTranslated);
      }
    }

    const report = { obsolete: 0, missing: 0 };

    await Promise.all(
      result.map(async language => {
        const {
          obsoleteTranslations,
          missingTranslations,
          unTranslated: unTranslatedKeys,
        } = language;
        const obsolete = obsoleteTranslations.length;
        const missing = missingTranslations.length;
        const unTranslated = unTranslatedKeys.length;
        if (update) {
          await updatedTranslations(dbKeyValues, language);
        }
        if (!locale) {
          process.stdout.write(
            `\x1b[36m ===  ${language.locale} === 
     \x1b[37m Obsolete: ${obsolete} \x1b[31m Missing ${missing}  \x1b[34m Untranslated ${unTranslated} \n`
          );
        }
        report.obsolete += obsolete;
        report.missing += missing;
      })
    );

    if (report.obsolete > 0 || report.missing > 0) {
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
    update: {
      alias: 't',
      type: 'boolean',
    },
  },
  () =>
    new Promise(resolve => {
      setTimeout(async () => {
        await compareTranslations(argv.locale, argv.update);
        resolve();
      }, 3000);
    })
);

yargs.parse('compareTranslations');
