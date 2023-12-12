/* eslint-disable */
import { join } from 'path';
import webpack from 'webpack';
import RtlCssPlugin from 'rtlcss-webpack-plugin';
import config from './config.js';

const { HotModuleReplacementPlugin, DefinePlugin } = webpack;

config();

const rootPath = `${__dirname}/../`;

config['infrastructureLogging'] = {
  level: 'error',
};

config.plugins = config.plugins.filter(plugin => !(plugin instanceof RtlCssPlugin));
config.plugins = config.plugins.concat([
  new HotModuleReplacementPlugin(),
  // enable HMR globally
  new DefinePlugin({ 'process.env': { HOT: true } }),
]);

config.optimization.moduleIds = 'named';
config.optimization.emitOnErrors = false;

config.output = {
  publicPath: 'http://localhost:8080/',
  filename: '[name].js',
};

config.entry.main = [
  'webpack-hot-middleware/client?path=//localhost:8080/__webpack_hmr',
  join(rootPath, 'app/react/entry-client.tsx'),
];

config.watchOptions = {
  ignored: '**/node_modules/*',
};

export default config;
