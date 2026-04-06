/* eslint-disable */
const path = require('path');
const webpack = require('webpack');

const config = require('./config.cjs')();
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const rootPath = `${__dirname}/../`;
const RtlCssPlugin = require('rtlcss-webpack-plugin');

config['infrastructureLogging'] = {
  level: 'error',
};

config.plugins = config.plugins.filter(
  plugin => !(plugin instanceof RtlCssPlugin) && !(plugin instanceof MiniCssExtractPlugin)
);
config.plugins.push(
  new MiniCssExtractPlugin({
    filename: 'CSS/[name].css',
    chunkFilename: 'CSS/[name].css',
  })
);

config.plugins = config.plugins.concat([
  new webpack.HotModuleReplacementPlugin(),
  // enable HMR globally
  new webpack.DefinePlugin({ 'process.env': { HOT: true } }),
]);

config.optimization.moduleIds = 'named';
config.optimization.emitOnErrors = false;

config.output = {
  path: path.join(rootPath, 'dist'),
  publicPath: 'http://localhost:8080/',
  filename: '[name].js',
};

config.entry.main = [
  'webpack-hot-middleware/client?path=//localhost:8080/__webpack_hmr',
  path.join(rootPath, 'app/react/entry-client.tsx'),
];

config.watchOptions = {
  ignored: [
    '**/node_modules/*',
    path.join(rootPath, 'log'),
    path.join(rootPath, 'uploaded_documents'),
    path.join(rootPath, 'custom_uploads'),
    path.join(rootPath, 'dist'),
    path.join(rootPath, 'cypress'),
  ],
};

module.exports = config;
