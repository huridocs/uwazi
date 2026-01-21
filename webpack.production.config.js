/* eslint-disable */
import webpack from 'webpack';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserWebpackPlugin from 'terser-webpack-plugin';
import configFactory from './webpack/config.cjs';

const production = true;
const config = configFactory(production);

config.devtool = 'hidden-source-map';
config.context = import.meta.url.replace('file://', '').replace('/webpack.production.config.js', '');
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

export default config;
