/* eslint-disable */
import webpack from 'webpack';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserWebpackPlugin from 'terser-webpack-plugin';
import configFactory from './webpack/config.cjs';

const production = true;
const config = configFactory(production);

config.context = import.meta.url.replace('file://', '').replace('/webpack.production.config.js', '');
config.devtool = 'hidden-source-map';
config.mode = 'production';

// Filter out falsy plugins (e.g., conditional CYPRESS plugin)
config.plugins = config.plugins.filter(Boolean).concat([
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

export default config;
