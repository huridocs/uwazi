/* eslint-disable no-multi-str */
/* eslint-disable no-console */
/* eslint-disable global-require */

require('dotenv').config();

const { NODE_ENV } = process.env;

require.extensions['.scss'] = function scss() {};
require.extensions['.css'] = function css() {};

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
    require('@babel/register')({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });
    require('./app/server.js');
  }
})();
