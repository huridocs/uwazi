/* eslint-disable global-require */
const { spawn } = require('child_process');
const url = require('url');

if (process.env.NODE_ENV !== 'production') {
  require('@babel/register')({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });
}
process.env.ROOT_PATH = process.env.ROOT_PATH || __dirname;

const { config } = require('../app/api/config');

const file = process.argv[2];

const clParameters = process.argv.slice(3);

if (file) {
  const mongoUri = url.parse(config.DBHOST);
  const bashProcess = spawn(file, clParameters, {
    env: {
      ...process.env,
      DBHOST: process.env.DBHOST || mongoUri.hostname,
    },
  });

  bashProcess.stdout.pipe(process.stdout);
  bashProcess.stderr.pipe(process.stderr);

  bashProcess.on('close', code => {
    process.exit(code);
  });

  bashProcess.on('error', error => {
    process.stderr.write(`[spawn error] ${error} \n`);
    process.exit(1);
  });
}
