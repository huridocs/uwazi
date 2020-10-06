process.env.NODE_ENV = 'production';
const webpack = require('webpack');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');

const production = true;
const config = require('./webpack/config')(production);

config.devtool = '';
config.context = __dirname;
config.mode = 'production';

config.plugins = config.plugins.concat([
  new webpack.optimize.OccurrenceOrderPlugin(),
  new OptimizeCssAssetsPlugin(),
  new webpack.optimize.AggressiveMergingPlugin(),
  new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify('production') } }),
]);

config.optimization.minimize = true;
config.optimization.minimizer = [
  new TerserWebpackPlugin({
    cache: true,
    parallel: true,
  }),
];

config.performance = {
  hints: 'warning',
};

module.exports = config;
