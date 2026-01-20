#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const lodashFunctions = [
  'isObject', 'isString', 'isArray', 'isEmpty', 'isEqual', 'isUndefined', 'isNull',
  'isNumber', 'isBoolean', 'isFunction', 'isDate', 'isPlainObject', 'isError',
  'get', 'set', 'has', 'omit', 'pick', 'merge', 'clone', 'cloneDeep', 'debounce',
  'throttle', 'uniq', 'uniqBy', 'groupBy', 'keyBy', 'map', 'filter', 'find',
  'findIndex', 'some', 'every', 'includes', 'without', 'difference', 'intersection',
  'union', 'sortBy', 'orderBy', 'partition', 'chunk', 'flatten', 'flattenDeep',
  'compact', 'defaults', 'defaultsDeep', 'assign', 'extend', 'keys', 'values',
  'entries', 'mapKeys', 'mapValues', 'invert', 'camelCase', 'kebabCase', 'snakeCase',
  'startCase', 'upperFirst', 'lowerFirst', 'capitalize', 'trim', 'trimStart', 'trimEnd',
  'padStart', 'padEnd', 'repeat', 'replace', 'split', 'join', 'toLower', 'toUpper',
  'escape', 'unescape', 'template', 'range', 'times', 'random', 'sample', 'shuffle',
  'size', 'sum', 'sumBy', 'mean', 'meanBy', 'min', 'max', 'minBy', 'maxBy',
  'round', 'floor', 'ceil', 'clamp', 'inRange', 'noop', 'identity', 'constant',
  'once', 'after', 'before', 'memoize', 'curry', 'partial', 'bind', 'bindAll',
  'delay', 'defer', 'now', 'uniqueId', 'escapeRegExp', 'isNaN', 'isFinite',
];

async function fixLodashImportsInFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let newContent = content;
  
  const namedImportPattern = /import\s+\{([^}]+)\}\s+from\s+['"]lodash['"]/g;
  
  const matches = [...newContent.matchAll(namedImportPattern)];
  
  if (matches.length === 0) {
    return { fixed: false, imports: 0 };
  }
  
  let totalImports = 0;
  
  for (const match of matches.reverse()) {
    const fullMatch = match[0];
    const importsList = match[1];
    const quote = match[2];
    
    const imports = importsList
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0)
      .map(i => {
        const parts = i.split(/\s+as\s+/);
        return {
          original: parts[0].trim(),
          alias: parts[1]?.trim() || parts[0].trim(),
        };
      });
    
    const importStatements = imports
      .map(({ original, alias }) => {
        if (lodashFunctions.includes(original)) {
          totalImports++;
          return `import ${alias} from 'lodash/${original}.js';`;
        }
        return null;
      })
      .filter(Boolean);
    
    if (importStatements.length > 0) {
      newContent = newContent.replace(fullMatch, importStatements.join('\n'));
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(filePath, newContent, 'utf-8');
    return { fixed: true, imports: totalImports };
  }
  
  return { fixed: false, imports: 0 };
}

async function main() {
  console.log('🔍 Fixing lodash imports for ESM compatibility...\n');
  
  const files = await glob('{app,scripts}/**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**', '**/coverage/**'],
  });
  
  console.log(`📁 Checking ${files.length} files...\n`);
  
  let fixedCount = 0;
  let totalImports = 0;
  
  for (const file of files) {
    try {
      const result = await fixLodashImportsInFile(file);
      if (result.fixed) {
        fixedCount++;
        totalImports += result.imports || 0;
        const fileRel = path.relative(projectRoot, file);
        console.log(`✅ Fixed: ${fileRel}`);
      }
    } catch (error) {
      console.error(`❌ Error checking ${path.relative(projectRoot, file)}: ${error.message}`);
    }
  }
  
  console.log(`\n✨ Fixed ${fixedCount} files`);
  console.log(`📊 Total lodash imports converted: ${totalImports}`);
}

main().catch(console.error);
