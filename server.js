require('babel-core/register')();

require.extensions['.scss'] = () => {};
require.extensions['.css'] = () => {};

require('./app/server.js');
