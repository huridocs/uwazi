/** @format */

/* eslint-disable import/first */
require('dotenv').config();
require('@babel/register')({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });

const fs = require('fs');
const { compile } = require('json-schema-to-typescript');

const buildSchema = path => {
  const schema = require(`./${path}Schema`).default;

  compile(schema, schema.title).then(ts => {
    fs.writeFileSync(`./${path}Type.d.ts`, ts);
  });
};

buildSchema('app/api/thesauris/dictionaries');
