/* eslint-disable */
require('es6-promise').polyfill(); // Required in some browsers

//babel polyfill ES6
require('babel-core/register')();

require.extensions['.scss'] = function () { return; };
require.extensions['.css'] = function () { return; };

require('./app/server.js');
