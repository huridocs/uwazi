const mongodb = require('mongodb');
const yargs = require('yargs');
const csv = require('@fast-csv/format');
const fs = require('fs');
const path = require('path');
const csvtojson = require('csvtojson');
const _ = require('lodash');

const TRANSLATIONS_DIR = `${__dirname}/../contents/ui-translations`;

const getClient = async () => {
  const url = process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://localhost/';
  const client = new mongodb.MongoClient(url, { useUnifiedTopology: true });
  await client.connect();

  return client;
};

const getTranslationsFromDB = async () => {
  const client = await getClient();
  const db = client.db(process.env.DATABASE_NAME || 'uwazi_development');
  const translations = await db.collection('translationsV2').find().toArray();
  client.close();

  const locToSystemContext = _.mapValues(
    _.groupBy(
      translations.filter(tr => tr.context.id === 'System'),
      'language'
    ),
    values => ({
      keys: values.map(tr => tr.key),
      values: values.map(tr => tr.value),
      keyValues: _.reduce(values, (keyValues, tr) => ({ ...keyValues, [tr.key]: tr.value }), {}),
    })
  );
  return locToSystemContext;
};

const getAvailableLanguages = async () =>
  new Promise((resolve, reject) => {
    fs.readdir(TRANSLATIONS_DIR, (err, files) => {
      if (err) reject(err);
      resolve(files.map(file => file.replace('.csv', '')));
    });
  });

const getKeysFromRepository = async locale =>
  new Promise((resolve, reject) => {
    fs.readFile(`${TRANSLATIONS_DIR}/${locale}.csv`, (err, fileContent) => {
      if (err) reject(err);

      csvtojson({
        delimiter: [',', ';'],
        quote: '"',
        headers: ['key', 'value'],
      })
        .fromString(fileContent.toString())
        .then(resolve)
        .catch(reject);
    });
  });

const reportResult = (keys, message) => {
  if (keys.length === 0) {
    return;
  }
  process.stdout.write(`\x1b[0m\x1b[31m    ...   ${keys.length}\x1b[31m ${message}   ...\x1b[0m\n`);
  keys.forEach(text => {
    process.stdout.write(`\x1b[0m        .  ${text}     \n`);
  });
};

const reportUntraslated = translations => {
  if (translations.length === 0) {
    return;
  }

  process.stdout.write(
    `\x1b[0m\x1b[31m    ...   ${translations.length} possible untranslated   ...\x1b[0m\n`
  );
  translations.forEach(({ key, value }) => {
    process.stdout.write(`\x1b[0m        .  ${key}\x1b[37m ${value}    \n`);
  });
};

async function updateTranslations(dbKeyValues, language) {
  // eslint-disable-next-line max-statements
  return new Promise(resolve => {
    const {
      locale,
      languageName,
      repositoryTranslations,
      obsoleteTranslations,
      missingTranslations,
    } = language;
    const fileName = path.resolve(TRANSLATIONS_DIR, `${locale}.csv`);
    const csvFile = fs.createWriteStream(fileName);
    const csvStream = csv.format({ headers: true });
    csvStream.pipe(csvFile).on('finish', csvFile.end);
    csvStream.write(['Key', languageName]);

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

const reportByLanguage = language => {
  const { obsoleteTranslations, missingTranslations, unTranslated: unTranslatedKeys } = language;
  if (
    obsoleteTranslations.length > 0 ||
    missingTranslations.length > 0 ||
    unTranslatedKeys.length > 0
  ) {
    process.stdout.write(`\x1b[7m ===  ${language.locale} === \x1b[0m\x1b[37m\n`);
  }
  reportResult(missingTranslations, 'missing keys ');
  reportResult(obsoleteTranslations, 'possible obsolete translations ');
  if (unTranslatedKeys.length > 0) {
    process.stdout.write(
      `\x1b[0m\x1b[31m    ...   ${unTranslatedKeys.length} untranslated    ...\x1b[0m\n`
    );
  }
  return { obsolete: obsoleteTranslations.length, missing: missingTranslations.length };
};

// eslint-disable-next-line max-statements
async function compareTranslations(locale, update) {
  try {
    const dbTranslations = await getTranslationsFromDB();
    const keysFromDB = dbTranslations.en.keys;
    const valuesFromDB = dbTranslations.en.values;
    const dbKeyValues = dbTranslations.en.keyValues;

    const languages = locale ? [locale] : await getAvailableLanguages();
    const result = await Promise.all(
      languages.map(language => processLanguage(keysFromDB, valuesFromDB, language))
    );

    if (result.length) {
      if (locale) {
        const [{ obsoleteTranslations, missingTranslations, unTranslated }] = result;
        reportResult(obsoleteTranslations, 'possible obsolete translations ');
        reportResult(missingTranslations, 'missing keys ');
        reportUntraslated(unTranslated);
      } else {
        const report = { obsolete: 0, missing: 0 };
        const languageNames = new Intl.DisplayNames(['en'], {
          type: 'language',
        });
        await Promise.all(
          result.map(async language => {
            if (update) {
              const languageName = languageNames.of(language.locale) || 'value';
              await updateTranslations(dbKeyValues, { ...language, languageName });
            }
            const { obsolete, missing } = reportByLanguage(language);
            report.obsolete += obsolete;
            report.missing += missing;
          })
        );
        if (report.obsolete > 0 || report.missing > 0) {
          process.stdout.write(
            // eslint-disable-next-line max-len
            '\x1b[0m Run \x1b[7m yarn compare-translations --update --outdir=PATH/uwazi-contents/ui-translation \x1b[0m to generate files with updates for missing and obsolete keys. \n'
          );
          process.exit(1);
        } else {
          process.stdout.write('\x1b[32m All good! \x1b[0m\n');
          process.exit(0);
        }
      }
    }
  } catch (e) {
    process.stdout.write(` === An error occurred === \n ${e}\n`);
    process.exit(1);
  }
}

yargs.parse();

const { argv } = yargs;
yargs.command(
  'compareTranslations',
  'compare translation between DB and Github Repository',
  {
    locale: {
      alias: 'l',
      type: 'string',
    },
    update: {
      alias: 'u',
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
