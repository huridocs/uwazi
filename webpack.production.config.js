process.env.NODE_ENV = 'production';
const webpack = require('webpack');
const os = require('os');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');

// Parallelization configuration
const numCpus = os.cpus().length;
const maxWorkers = Math.max(1, numCpus - 1); // Leave one core free for system processes

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
  new CssMinimizerPlugin({
    parallel: maxWorkers,
  }),
  new TerserWebpackPlugin({
    parallel: maxWorkers,
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    extractComments: false, // Don't extract comments to separate files
  }),
];

config.performance = {
  hints: 'warning',
};

module.exports = config;
