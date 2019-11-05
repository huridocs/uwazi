require('dotenv').config();

process.env.ROOT_PATH = process.env.ROOT_PATH || __dirname;
const { NODE_ENV } = process.env;

require.extensions['.scss'] = function scss() {};
require.extensions['.css'] = function css() {};

if (NODE_ENV === 'production') {
  require('./prod/app/server.js');
} else {
  require('@babel/register')({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });
  require('./app/server.js');
}
