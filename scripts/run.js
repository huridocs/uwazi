import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

if (process.env.NODE_ENV !== 'production') {
  const { default: babelRegister } = await import('@babel/register');
  babelRegister({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });
}

const cwd = process.env.USE_CWD ? process.cwd() : undefined;

process.env.ROOT_PATH = process.env.ROOT_PATH || cwd || __dirname;

const file = process.argv[2];
if (file) {
  await import(file);
}
