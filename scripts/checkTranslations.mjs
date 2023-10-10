import parser from '@babel/parser';
import traverse from '@babel/traverse';
import mongodb from 'mongodb';

import { resolve } from 'path';
// eslint-disable-next-line node/no-restricted-import
import { promises } from 'fs';

async function getFiles(dir) {
  const dirents = await promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(dirent => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype
    .concat(...files)
    .filter(
      file =>
        !file.match('.spec') &&
        !file.match('.stories') &&
        !file.match('.cy') &&
        (file.endsWith('.js') ||
          file.endsWith('.ts') ||
          file.endsWith('.tsx') ||
          file.endsWith('.jsx'))
    );
}

const parserOptions = {
  sourceType: 'module',

  plugins: [
    // enable jsx and typescript syntax
    'jsx',
    'typescript',
  ],
};

const wordRegexp = /\b[a-zA-Z]+\b/g;

const processTextNode = (path, file) => {
  const text = path.node.value.trim();
  const parentTag = path.parent.openingElement;
  const container = parentTag?.name.name;
  if (!wordRegexp.test(text)) {
    return null;
  }

  let key;
  if (container === 'Translate' && container && parentTag.attributes.length) {
    key = parentTag.attributes.find(a => a.name.name === 'translationKey')?.value.value;
  }
  const shortName = file.split('app/react/').pop();
  return { text, container, file: shortName, key };
};

const processTFunction = (path, file) => {
  const shortName = file.split('app/react/').pop();
  const key = path.node.arguments[1].value;
  const text = path.node.arguments[2]?.value ? path.node.arguments[2].value : key;

  if (!text) {
    return null;
  }

  return { text: text || key, container: 't', file: shortName, key };
};

const comparableString = text => text.replaceAll(/['\s;]|&(#39|#x27|quot|rsquo|apos);/g, '');

async function parseFile(file, translations) {
  const result = [];
  const fileContents = await promises.readFile(file, 'utf8');

  if (!file.includes('/migrations/')) {
    const comparableContent = comparableString(fileContents);

    translations
      .filter(translation => !translation.used)
      .forEach(translation => {
        if (
          comparableContent.includes(translation.plainValue) ||
          comparableContent.includes(translation.plainKey)
        ) {
          // eslint-disable-next-line no-param-reassign
          translation.used = true;
        }
      });
  }

  if (file.includes('app/react')) {
    const ast = parser.parse(fileContents, parserOptions);
    traverse.default(ast, {
      enter(path) {
        if (
          path.isCallExpression() &&
          path.node.callee.name === 't' &&
          path.node.arguments[0].value === 'System'
        ) {
          result.push(processTFunction(path, file));
        }
        if (path.isJSXElement()) {
          const noTranslate = path.node.openingElement.attributes.find(
            a => a.name?.name === 'no-translate'
          );
          if (noTranslate) {
            path.skip();
          }
        }
        if (path.isJSXText()) {
          result.push(processTextNode(path, file));
        }
      },
    });
    return result.filter(t => t);
  }
  return [];
}

const getClient = async () => {
  const url = process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://127.0.0.1/';
  const client = new mongodb.MongoClient(url, { useUnifiedTopology: true });
  await client.connect();

  return client;
};

const getSystemUITranslations = async () => {
  const client = await getClient();
  const db = client.db(process.env.DATABASE_NAME || 'uwazi_development');
  const collection = db.collection('translations');
  const [firstTranslation] = await collection.find().toArray();
  const systemContext = firstTranslation.contexts.find(c => c.id === 'System');
  client.close();
  const translations = systemContext.values;
  const comparableTranslations = translations.map(t => ({
    ...t,
    plainValue: comparableString(t.value),
    plainKey: comparableString(t.key),
  }));
  return { translations, comparableTranslations };
};

const checkSystemKeys = async (allTexts, translations) => {
  const textsNotInTranslations = allTexts.filter(text => {
    let key = text.key || text.text;
    key = key.trim().replace(/\n\s*/g, ' ');
    return !translations.find(t => t.key === key);
  });

  return textsNotInTranslations;
};

const reportNoTranslateElement = textsWithoutTranslateElement => {
  if (!textsWithoutTranslateElement.length) {
    return;
  }

  textsWithoutTranslateElement.forEach(({ text, container, file }) => {
    process.stdout.write(`\x1b[36m ${file}\x1b[37m ${text}\x1b[31m ${container}\x1b[0m \n`);
  });

  process.stdout.write(
    ` === Found \x1b[31m ${textsWithoutTranslateElement.length} \x1b[0m texts not wrapped in a <Translate> element === \n`
  );
};

const reportnotInTranslations = textsNotInTranslations => {
  if (!textsNotInTranslations.length) {
    return;
  }
  textsNotInTranslations.forEach(({ text, file }) => {
    process.stdout.write(` \x1b[36m ${file} \x1b[37m ${text}\x1b[0m \n`);
  });

  process.stdout.write(
    ` === Found \x1b[31m ${textsNotInTranslations.length} \x1b[0m texts not in translations collection ===\n`
  );
};

const checkForPotentialObsoleteTranslations = comparableTranslations => {
  const nonUsed = comparableTranslations.filter(translation => !translation.used);
  if (!nonUsed.length) {
    return [];
  }
  nonUsed.forEach(({ key, value }) => {
    process.stdout.write(` \x1b[36m ${key} \x1b[37m ${value}\x1b[0m \n`);
  });

  process.stdout.write(
    ` === Found \x1b[31m ${nonUsed.length} \x1b[0m potential obsolete translations ===\n`
  );

  return nonUsed;
};

const checkForMissingTranslations = async (translations, results) => {
  const allTexts = results.flat();
  const textsNotInTranslations = await checkSystemKeys(allTexts, translations);
  const textsWithoutTranslateElement = allTexts.filter(
    t => t.container !== 'Translate' && t.container !== 't'
  );
  reportNoTranslateElement(textsWithoutTranslateElement);
  reportnotInTranslations(textsNotInTranslations);
  return { textsNotInTranslations, textsWithoutTranslateElement };
};

async function checkTranslations(dir) {
  const files = await getFiles(dir);
  const { translations, comparableTranslations } = await getSystemUITranslations();
  const results = await Promise.all(files.map(file => parseFile(file, comparableTranslations)));
  const nonUsed = checkForPotentialObsoleteTranslations(comparableTranslations);
  const { textsNotInTranslations, textsWithoutTranslateElement } =
    await checkForMissingTranslations(translations, results);
  if (textsNotInTranslations.length || textsWithoutTranslateElement.length || nonUsed.length) {
    process.exit(1);
  } else {
    process.stdout.write('\x1b[32m All good! \x1b[0m\n');
    process.exit(0);
  }
}

checkTranslations('./app');
