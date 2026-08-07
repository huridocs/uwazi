import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

config();

if (process.env.NODE_ENV !== 'production') {
  require('@babel/register')({
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
}

const cwd = process.env.USE_CWD ? process.cwd() : undefined;

process.env.ROOT_PATH = process.env.ROOT_PATH || cwd || __dirname;

const file = process.argv[2];
if (file) {
  await import(file);
}
