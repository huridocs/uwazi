process.env.NODE_ENV = 'production';
const webpack = require('webpack');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');

const production = true;
const config = require('./webpack/config')(production);

config.devtool = 'source-map';
config.context = __dirname;
config.mode = 'production';

config.plugins = config.plugins.concat([
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
    },
  }),
]);

config.optimization.minimize = true;
config.optimization.minimizer = [
  new CssMinimizerPlugin(),
  new TerserWebpackPlugin({
    parallel: true,
  }),
];

config.performance = {
  hints: 'warning',
};

module.exports = config;
