/* eslint-disable import/first,global-require,import/no-dynamic-require,no-console */
require('dotenv').config();
require('@babel/register')({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });

const fs = require('fs');
const path = require('path');
const { compile } = require('json-schema-to-typescript');

const opts = {
  strictIndexSignatures: true,
  enableConstEnums: false,
  declareExternallyReferenced: false,
  bannerComment: '',
  style: {
    singleQuote: true,
  },
};
const banner = '/* eslint-disable */\n/**AUTO-GENERATED. RUN yarn emit-types to update.*/\n';

const customImports = {
  'app/shared/types/commonSchemas.ts': ["import { ObjectId } from 'mongodb';"],
};

const firstUp = name => name.charAt(0).toUpperCase() + name.slice(1);
const typesFileName = file =>
  file
    .replace('Schema', 'Type')
    .replace('.js', '.ts')
    .replace('.ts', '.d.ts');
const typeImportRegex = /import[^;]*from '(.*Schemas?)';/;
const typeImportFindRegex = /import[^;]*from '(.*Schemas?)';/g;

const typeImports = matches => {
  if (!(matches && matches.length)) {
    return '';
  }
  return matches.reduce((res, match) => {
    const file = match.match(typeImportRegex)[1];
    const typeFile = typesFileName(file);
    const schemas = require(`./app/${file}`);
    let final = match.replace(file, typeFile);
    Object.entries(schemas).forEach(([name, schema]) => {
      if (name.match(/Schema/)) {
        final = final.replace(name, schema.title || firstUp(name));
      }
    });
    return `${res}\n${final}\n`;
  }, '');
};

const writeTypeFile = (file, commonImport, snippets) => {
  const goodSnippets = snippets.filter(p => p);
  if (goodSnippets.length) {
    const typeFile = typesFileName(file);
    const customImport = customImports[file] ? `${customImports[file].join('\n')}\n` : '';
    console.log(`Emitting ${goodSnippets.length} types from ${file} to ${typeFile}.`);
    fs.writeFileSync(
      typeFile,
      banner + customImport + commonImport + goodSnippets.reduce((res, s) => `${res}\n${s}`, '')
    );
  }
};

const emitSchemaTypes = async file => {
  try {
    if (!file.match(/Schema/) || file.match(/spec/)) {
      return;
    }

    const schemas = require(`./${file}`);

    if (!schemas.emitSchemaTypes) {
      return;
    }

    const snippets = await Promise.all(
      Object.entries(schemas).map(([name, schema]) => {
        if (!name.match(/Schema$/)) {
          return '';
        }
        return compile(schema, schema.title || firstUp(name), opts);
      })
    );

    const contents = fs.readFileSync(file).toString();

    writeTypeFile(file, typeImports(contents.match(typeImportFindRegex)), snippets);
  } catch (err) {
    console.error(`Failed emitting types from ${file}: ${err}.`);
  }
};

function walk(dir, callback) {
  fs.readdir(dir, (err, files) => {
    if (err) throw err;
    files.forEach(file => {
      const filepath = path.join(dir, file);
      fs.stat(filepath, (err2, stats) => {
        if (err2) throw err2;
        if (stats.isDirectory()) {
          walk(filepath, callback);
        } else if (stats.isFile()) {
          callback(filepath, stats);
        }
      });
    });
  });
}

walk('./app', emitSchemaTypes);
