/* eslint-disable */
import path, { join } from 'path';
import webpack from 'webpack';
import { fileURLToPath } from 'url';
import RtlCssPlugin from 'rtlcss-webpack-plugin';
import configFn from './config.mjs';

const { HotModuleReplacementPlugin, DefinePlugin } = webpack;

const config = configFn();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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

const output = {
  publicPath: 'http://localhost:8080/',
  filename: '[name].js',
};

config.output = output;

config.entry.main = [
  'webpack-hot-middleware/client?path=//localhost:8080/__webpack_hmr',
  join(rootPath, 'app/react/entry-client.tsx'),
];

config.watchOptions = {
  ignored: '**/node_modules/*',
};

export { output }
export default config;
