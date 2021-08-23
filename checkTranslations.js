const parser = require('@babel/parser');
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
    'flow',
  ],
};

async function parseFile(filename) {
  const fileContents = await readFile(filename, 'utf8');

  const parseResult = parser.parse(fileContents, parserOptions);
  console.log(parseResult);
  return parseResult;
}

async function checkTranslations(dir) {
  const allFiles = await getFiles(dir);
  const files = allFiles.filter(file => file.endsWith('.js') || file.endsWith('.ts'));
  const results = await Promise.all(files.map(file => parseFile(file)));
}

checkTranslations('./app/react');
