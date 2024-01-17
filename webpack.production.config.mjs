import webpack from 'webpack';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserWebpackPlugin from 'terser-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import configFunction from './webpack/config.mjs';

process.env.NODE_ENV = 'production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const production = true;
const config = configFunction(production);

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

export default config;
