/* eslint-disable */
const path = require('path');
const webpack = require('webpack');

const config = require('./config.cjs')();
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const rootPath = `${__dirname}/../`;
const RtlCssPlugin = require('rtlcss-webpack-plugin');
const webpackPort = process.env.WEBPACK_PORT || 8080;
const webpackHost = `http://localhost:${webpackPort}`;

const patchCssRulesForHot = rules => {
  rules.forEach(rule => {
    if (!rule.use) {
      return;
    }

    rule.use = rule.use.map(loader => {
      if (loader === MiniCssExtractPlugin.loader) {
        return {
          loader: MiniCssExtractPlugin.loader,
          options: { esModule: true },
        };
      }

      if (typeof loader === 'object' && loader.loader === 'css-loader') {
        return { ...loader, options: { ...loader.options, sourceMap: false } };
      }

      if (typeof loader === 'object' && loader.loader === 'sass-loader') {
        return { ...loader, options: { ...loader.options, sourceMap: false } };
      }

      if (typeof loader === 'object' && loader.loader === 'postcss-loader') {
        return {
          ...loader,
          options: {
            ...loader.options,
            sourceMap: false,
            postcssOptions: {
              ...loader.options.postcssOptions,
              cache: true,
            },
          },
        };
      }

      return loader;
    });
  });
};

config['infrastructureLogging'] = {
  level: 'error',
};

config.devtool = 'eval-cheap-module-source-map';

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
  new ReactRefreshWebpackPlugin({ overlay: false }),
  new webpack.DefinePlugin({ 'process.env': { HOT: true } }),
]);

config.optimization.moduleIds = 'named';
config.optimization.emitOnErrors = false;

config.output = {
  path: path.join(rootPath, 'dist'),
  publicPath: `${webpackHost}/`,
  filename: '[name].js',
};

config.entry.main = [
  `webpack-hot-middleware/client?path=//localhost:${webpackPort}/__webpack_hmr`,
  path.join(rootPath, 'app/react/entry-client.tsx'),
];

patchCssRulesForHot(config.module.rules);

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
