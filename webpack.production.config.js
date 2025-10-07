process.env.NODE_ENV = 'production';
const webpack = require('webpack');
const os = require('os');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');

const production = true;
const config = require('./webpack/config')(production);

config.devtool = 'source-map';
config.context = __dirname;
config.mode = 'production';

// Ensure production builds use filesystem cache for better CI performance
config.cache = {
  ...config.cache,
  type: 'filesystem',
  buildDependencies: {
    config: [__filename],
    // Include all config files that affect the build
    tsconfig: [require('path').resolve(__dirname, 'tsconfig.json')],
    babel: [require('path').resolve(__dirname, 'babel.config.json')],
    tailwind: [require('path').resolve(__dirname, 'tailwind.config.js')],
    postcss: [require('path').resolve(__dirname, 'postcss.config.js')],
  },
  cacheDirectory: require('path').resolve(__dirname, '.webpack-cache'),
  compression: 'gzip',
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  profile: true,
  allowCollectingMemory: true,
};

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
