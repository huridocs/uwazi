/* eslint-disable no-multi-str */
/* eslint-disable no-console */
/* eslint-disable global-require */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { NODE_ENV } = process.env;

// Note: require.extensions is not available in ESM
// These extensions will be handled by the build process

process.env.ROOT_PATH = process.env.ROOT_PATH || __dirname;

(async () => {
  if (NODE_ENV === 'production') {
    try {
      require('./app/server.js');
    } catch (e) {
      console.error(e);
      console.error(
        '\x1b[31m%s\x1b[0m',
        "\nIf you are in a development environment you are probably trying to run a production uwazi using the wrong script if that is the case run: \
\n- 'yarn production-build' \n- 'yarn run-production'"
      );
    }
  } else {
    const { default: babelRegister } = await import('@babel/register');
    babelRegister({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });
    await import('./app/server.js');
  }
})();
