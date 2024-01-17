import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.env.ROOT_PATH = process.env.ROOT_PATH || __dirname;
const { NODE_ENV } = process.env;

dotenv.config();

// require.extensions['.scss'] = function scss() {};
// require.extensions['.css'] = function css() {};

(async () => {
  if (NODE_ENV === 'production') {
    try {
      await import('./app/server.js');
    } catch (err) {
      await import('./prod/app/server.js');
    }
  } else {
    const { default: babelRegister } = await import('@babel/register');
    babelRegister({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });
    await import('./app/server.js');
  }
})();
