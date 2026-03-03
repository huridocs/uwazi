import { spawn } from 'child_process';

process.env.ROOT_PATH = process.env.ROOT_PATH || new URL('.', import.meta.url).pathname;

const file = process.argv[2];
const clParameters = process.argv.slice(3);

if (file) {
  const dbHost = process.env.DBHOST || 'mongodb://127.0.0.1/';
  const mongoUri = new URL(dbHost);
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
