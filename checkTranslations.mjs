/* eslint-disable no-console */

import parser from '@babel/parser';
import traverse from '@babel/traverse';
import mongodb from 'mongodb';

import { resolve } from 'path';
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
    .filter(file => !file.match('.spec') && (file.endsWith('.js') || file.endsWith('.ts')));
}

const parserOptions = {
  sourceType: 'module',

  plugins: [
    // enable jsx and typescript syntax
    'jsx',
    'typescript',
  ],
};

const wordRegexp = new RegExp(/\b[\w']+\b/g);

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

async function parseFile(file) {
  const result = [];
  const fileContents = await promises.readFile(file, 'utf8');

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

const getClient = async () => {
  const url = 'mongodb://localhost/';
  const client = new mongodb.MongoClient(url, { useUnifiedTopology: true });
  await client.connect();

  return client;
};

const checkSystemKeys = async allTexts => {
  const client = await getClient();
  const db = client.db(process.env.DATABASE_NAME || 'uwazi_development');
  const collection = db.collection('translations');
  const [firstTranslation] = await collection.find().toArray();
  const systemContext = firstTranslation.contexts.find(c => c.id === 'System');

  const textsNotInTranslations = allTexts.filter(text => {
    const key = text.key || text.text;
    return !systemContext.values.find(t => t.key === key);
  });

  client.close();
  return textsNotInTranslations;
};

const reportNoTranslaeElement = textsWithoutTranslateElement => {
  if (!textsWithoutTranslateElement.length) {
    return;
  }

  textsWithoutTranslateElement.forEach(({ text, container, file }) => {
    console.log('\x1b[36m', file, '\x1b[37m', text, '\x1b[31m', container, '\x1b[0m');
  });

  console.log(
    '\x1b[33m',
    ' === Found',
    '\x1b[31m',
    `${textsWithoutTranslateElement.length}`,
    '\x1b[33m',
    'texts not wrapped in a <Translate> element === ',
    '\x1b[0m'
  );
};

const reportnotInTranslations = textsNotInTranslations => {
  if (!textsNotInTranslations.length) {
    return;
  }
  textsNotInTranslations.forEach(({ text, file }) => {
    console.log('\x1b[36m', file, '\x1b[37m', text);
  });

  console.log(
    '\x1b[33m',
    ' === Found',
    '\x1b[31m',
    `${textsNotInTranslations.length}`,
    '\x1b[33m',
    'texts not in translations collection === ',
    '\x1b[0m'
  );
};

async function checkTranslations(dir) {
  const files = await getFiles(dir);

  const results = await Promise.all(files.map(file => parseFile(file)));
  const allTexts = results.reduce((acc, curr) => acc.concat(curr), []);
  const textsNotInTranslations = await checkSystemKeys(allTexts);
  const textsWithoutTranslateElement = allTexts.filter(
    t => t.container !== 'Translate' && t.container !== 't'
  );
  reportNoTranslaeElement(textsWithoutTranslateElement);
  // reportnotInTranslations(textsNotInTranslations);

  if (textsNotInTranslations.length || textsWithoutTranslateElement.length) {
    process.exit(1);
  }
}

checkTranslations('./app/react');
