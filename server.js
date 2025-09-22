/* eslint-disable no-multi-str */
/* eslint-disable no-console */
import { access } from 'fs/promises';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

process.env.ROOT_PATH = process.env.ROOT_PATH || __dirname;
const { NODE_ENV } = process.env;

// Note: require.extensions is not available in ESM
// These extensions will be handled by the build process

const fileExists = async filePath => {
  try {
    await access(filePath);
  } catch (err) {
    if (err?.code === 'ENOENT') {
      return false;
    }
    if (err) {
      throw err;
    }
  }
  return true;
};

(async () => {
  if (NODE_ENV === 'production') {
    const productionBuildExists = await fileExists('./prod/app/server.js');
    if (productionBuildExists) {
      await import('./prod/app/server.js');
    } else {
      try {
        await import('./app/server.js');
      } catch (e) {
        console.error(e);
        console.error(
          '\x1b[31m%s\x1b[0m',
          "\nIf you are in a development environment you are probably trying to run a production uwazi without a production build, \
try 'yarn production-build' first"
        );
      }
    }
  } else {
    const { default: babelRegister } = await import('@babel/register');
    babelRegister({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });
    await import('./app/server.js');
  }
})();
