const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const { resolve } = require('path');
const { readdir, readFile } = require('fs').promises;

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(dirent => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

const parserOptions = {
  // parse in strict mode and allow module declarations
  sourceType: 'module',

  plugins: [
    // enable jsx and flow syntax
    'jsx',
    'typescript',
  ],
};

const wordRegexp = new RegExp(/\b[\w']+\b/g);
async function parseFile(file) {
  const result = [];
  const fileContents = await readFile(file, 'utf8');

  const ast = parser.parse(fileContents, parserOptions);
  traverse(ast, {
    enter(path) {
      if (path.type === 'JSXText') {
        const text = path.node.value.trim();
        const element = path.parent.openingElement?.name.name;
        if (wordRegexp.test(text)) {
          let key;
          if (element === 'Translate' && element && path.parent.openingElement.attributes.length) {
            key = path.parent.openingElement.attributes.find(a => a.name.name === 'translationKey')
              ?.value.value;
          }
          const shortName = file.split('app/react/').pop();
          result.push({ text, element, file: shortName, key });
        }
      }
    },
  });

  return result;
}

async function checkTranslations(dir) {
  const allFiles = await getFiles(dir);
  const files = allFiles.filter(
    file => !file.match('.spec') && (file.endsWith('.js') || file.endsWith('.ts'))
  );

  const results = await Promise.all(files.map(file => parseFile(file)));
  const allTexts = results.reduce((acc, curr) => acc.concat(curr), []);

  const textsWithoutTranslateElement = allTexts.filter(t => t.element !== 'Translate');
  textsWithoutTranslateElement.forEach(({ text, element, file }) => {
    console.log('\x1b[36m', file, '\x1b[37m', text, '\x1b[31m', element, '\x1b[0m');
  });

  console.log(
    '\x1b[31m',
    `Found ${textsWithoutTranslateElement.length} texts not wrapped in a <Translate> element`,
    '\x1b[0m'
  );
}

checkTranslations('./app/react');
