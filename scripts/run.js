/* eslint-disable global-require */
require('dotenv').config();

if (process.env.NODE_ENV !== 'production') {
  require('@babel/register')({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });
}

const cwd = process.env.USE_CWD ? process.cwd() : undefined;

process.env.ROOT_PATH = process.env.ROOT_PATH || cwd || __dirname;

const file = process.argv[2];
if (file) {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  require(file);
}
