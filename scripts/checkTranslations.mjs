import parser from '@babel/parser';
import traverse from '@babel/traverse';
import mongodb from 'mongodb';

import { resolve } from 'path';
// eslint-disable-next-line node/no-restricted-import
import { promises } from 'fs';
import {
  comparableString,
  checkContentBasedMatch,
  checkStringLiteralMatch,
} from './translationUtils.mjs';

async function getFiles(dir) {
  try {
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
          !file.includes('.spec') &&
          !file.includes('stories') &&
          !file.includes('.cy') &&
          (file.endsWith('.js') ||
            file.endsWith('.ts') ||
            file.endsWith('.tsx') ||
            file.endsWith('.jsx'))
      );
  } catch (error) {
    process.stderr.write(`ERROR in getFiles('${dir}'): ${error.message}\n`);
    return [];
  }
}

const parserOptions = {
  sourceType: 'module',

  plugins: [
    // enable jsx and typescript syntax
    'jsx',
    'typescript',
  ],
};

const processTextNode = (path, file) => {
  const wordRegexp = /\b[a-zA-Z]+\b/g;
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


async function parseFile(file, translations) {
  const result = [];
  const fileContents = await promises.readFile(file, 'utf8');
  const isReactFile = file.includes('app/react');
  const isMigrationFile = file.includes('/migrations/');

  if (isReactFile && !isMigrationFile) {
    checkContentBasedMatch(fileContents, translations);
  }

  // Use AST parsing for all files (both React and backend) to find explicit translation usage
  // This catches t() calls, Translate components, and string literals
  if (!isMigrationFile) {
    try {
      const ast = parser.parse(fileContents, parserOptions);

      traverse.default(ast, {
        enter(path) {
          if (
            path.isCallExpression() &&
            path.node.callee.name === 't' &&
            path.node.arguments[0].value === 'System'
          ) {
            const tFunctionResult = processTFunction(path, file);
            if (tFunctionResult) {
              result.push(tFunctionResult);
              // Mark translation as used when found via t() function
              if (tFunctionResult.key) {
                const translation = translations.find(t => t.key === tFunctionResult.key);
                if (translation) {
                  // eslint-disable-next-line no-param-reassign
                  translation.used = true;
                }
              }
            }
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
            const textNode = processTextNode(path, file);
            if (textNode) {
              result.push(textNode);
              // Mark translation as used if found in Translate component with translationKey
              if (textNode.key) {
                const translation = translations.find(t => t.key === textNode.key);
                if (translation) {
                  // eslint-disable-next-line no-param-reassign
                  translation.used = true;
                }
              } else if (textNode.container === 'Translate') {
                // For Translate components without translationKey, check if text matches a translation key
                const normalizedText = comparableString(textNode.text);
                const translation = translations.find(
                  t => comparableString(t.key) === normalizedText || comparableString(t.value) === normalizedText
                );
                if (translation) {
                  // eslint-disable-next-line no-param-reassign
                  translation.used = true;
                }
              }
            }
          }
          if (path.isStringLiteral()) {
            checkStringLiteralMatch(path.node.value, translations);
          }
        },
      });
    } catch (error) {
      // Skip files that can't be parsed (e.g., non-JS/TS files that passed the filter)
    }
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
  const collection = db.collection('translationsV2');
  const translations = await collection.find({ 'context.id': 'System' }).toArray();
  client.close();
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
    return !translations.find(t => t.key.trim().replace(/\n\s*/g, ' ') === key);
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
