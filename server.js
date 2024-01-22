/* eslint-disable no-multi-str */
/* eslint-disable no-console */
const { access } = require('fs/promises');

/* eslint-disable global-require */
require('dotenv').config();

process.env.ROOT_PATH = process.env.ROOT_PATH || __dirname;
const { NODE_ENV } = process.env;

require.extensions['.scss'] = function scss() { };
require.extensions['.css'] = function css() { };

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
      require('./prod/app/server.js');
    } else {
      try {
        require('./app/server.js');
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
    require('@babel/register')({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });
    require('./app/server.js');
  }
})();
