/* eslint-disable */
const path = require('path');
const webpack = require('webpack');

const config = require('./config')();

const rootPath = `${__dirname}/../`;
const RtlCssPlugin = require('rtlcss-webpack-plugin');

config['infrastructureLogging'] = {
  level: 'error',
};

config.plugins = config.plugins.filter(plugin => !(plugin instanceof RtlCssPlugin));
config.plugins = config.plugins.concat([
  new webpack.HotModuleReplacementPlugin(),
  // enable HMR globally
  new webpack.DefinePlugin({ 'process.env': { HOT: true } }),
]);

config.optimization.moduleIds = 'named';
config.optimization.emitOnErrors = false;

config.output = {
  publicPath: 'http://localhost:8080/',
  filename: '[name].js',
};

config.entry.main = [
  'webpack-hot-middleware/client?path=//localhost:8080/__webpack_hmr',
  path.join(rootPath, 'app/react/entry-client.tsx'),
];

config.watchOptions = {
  ignored: '**/node_modules/*',
};

module.exports = config;
