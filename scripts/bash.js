import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
process.env.ROOT_PATH = process.env.ROOT_PATH || path.resolve(scriptDir, '..');

const file = process.argv[2];
const clParameters = process.argv.slice(3);

const resolveBash = () => {
  if (process.platform !== 'win32') {
    return 'bash';
  }

  const candidates = [
    process.env.BASH_PATH,
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return 'bash';
};

if (file) {
  const dbHost = process.env.DBHOST || 'mongodb://127.0.0.1/';
  const mongoUri = new URL(dbHost);
  const scriptPath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
  const bashExecutable = resolveBash();

  const bashProcess = spawn(bashExecutable, [scriptPath, ...clParameters], {
    env: {
      ...process.env,
      DBHOST: process.env.DBHOST || mongoUri.hostname,
    },
  });

  bashProcess.stdout.pipe(process.stdout);
  bashProcess.stderr.pipe(process.stderr);

  bashProcess.on('close', code => {
    process.exit(code ?? 1);
  });

  bashProcess.on('error', error => {
    process.stderr.write(
      `[spawn error] Failed to run "${bashExecutable}" for ${scriptPath}: ${error}\n` +
        'On Windows, install Git for Windows and ensure bash.exe is available.\n'
    );
    process.exit(1);
  });
}
