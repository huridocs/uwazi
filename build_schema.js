/** @format */

/* eslint-disable import/first */
require('dotenv').config();
require('@babel/register')({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });

const fs = require('fs');
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
const banner = '/* eslint-disable */\n/**AUTO-GENERATED. RUN yarn build_schema to update.*/\n';

const firstUp = name => name.charAt(0).toUpperCase() + name.slice(1);

const typeImports = matches => {
  if (!(matches && matches.length)) {
    return '';
  }
  return matches.reduce((res, match) => {
    const file = match.match(/import.*from '(.*Schema)';/)[1];
    const typeFile = file.replace('Schema', 'Type');
    const schemas = require(`./app/${file}`);
    let final = match.replace(file, typeFile);
    Object.entries(schemas).forEach(([name, schema]) => {
      if (!name.match(/Schema/)) {
        return '';
      }
      final = final.replace(name, schema.title || firstUp(name));
    });
    return `${res}\n${final}\n`;
  }, '');
};

const buildSchema = async path => {
  const file = fs.existsSync(`./${path}Schema.ts`) ? `./${path}Schema.ts` : `./${path}Schema.js`;
  const contents = fs.readFileSync(file).toString();
  const commonImport = typeImports(contents.match(/import.*from '.*Schema';/g));
  const schemas = require(file);
  const snippets = await Promise.all(
    Object.entries(schemas).map(([name, schema]) => {
      if (!name.match(/Schema/)) {
        return '';
      }
      return compile(schema, schema.title || firstUp(name), opts);
    })
  );
  fs.writeFileSync(
    `./${path}Type.d.ts`,
    banner + commonImport + snippets.reduce((res, s) => `${res}\n${s}`, '')
  );
};

buildSchema('app/api/entities/common');
buildSchema('app/api/thesauris/dictionaries');
buildSchema('app/api/entities/entity');
buildSchema('app/api/templates/template');
