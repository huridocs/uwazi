/* eslint-disable */
'use strict';

var path = require('path');
var webpack = require('webpack');
var config = require('./config')();

var rootPath = __dirname + '/../';

config.plugins = config.plugins.concat([
  new webpack.HotModuleReplacementPlugin(),
  // enable HMR globally

  new webpack.NamedModulesPlugin(),
  // prints more readable module names in the browser console on HMR updates

  new webpack.NoEmitOnErrorsPlugin()
  // do not emit compiled assets that include errors
])

config.output = {
  publicPath: 'http://localhost:8080/',
  filename: '[name].js'
}

config.entry.main = ['react-hot-loader/patch', 'webpack-hot-middleware/client?path=//localhost:8080/__webpack_hmr', path.join(rootPath, 'app/react/index.js')];

module.exports = config;
