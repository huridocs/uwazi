/** @format */

/* eslint-disable import/first */
require('dotenv').config();
require('@babel/register')({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });

const fs = require('fs');
const { compile } = require('json-schema-to-typescript');

const opts = {
  strictIndexSignatures: true,
  enableConstEnums: false,
  bannerComment: '',
  style: {
    singleQuote: true,
  },
};
const banner = '/* eslint-disable */\n/**AUTO-GENERATED. RUN yarn build_schema to update.*/\n';

const buildSchema = async path => {
  const schemas = require(`./${path}Schema`);
  const snippets = await Promise.all(
    Object.entries(schemas).map(([name, schema]) => {
      if (!name.match(/Schema/)) {
        return '';
      }
      return compile(schema, schema.title || name.charAt(0).toUpperCase() + name.slice(1), opts);
    })
  );
  fs.writeFileSync(`./${path}Type.d.ts`, banner + snippets.reduce((res, s) => `${res}\n${s}`, ''));
};

buildSchema('app/api/thesauris/dictionaries');
buildSchema('app/api/entities/entity');
buildSchema('app/api/templates/template');
