/* eslint-disable */
'use strict';

var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CleanPlugin = require('./CleanPlugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var rootPath = __dirname + '/../';

var AssetsPlugin = require('assets-webpack-plugin')
var assetsPluginInstance = new AssetsPlugin({path: path.join(rootPath + '/dist/')})

module.exports = function(production) {
  var stylesName = 'styles.css';
  var jsChunkHashName = '';

  if (production) {
    stylesName = 'styles.[contenthash].css';
    jsChunkHashName = '.[chunkhash]';
  }

  const CoreCss = new ExtractTextPlugin(stylesName);
  const VendorCSS = new ExtractTextPlugin('vendor.' + stylesName);

  return {
    context: rootPath,
    devtool: '#eval-source-map',
    entry: {
      main: path.join(rootPath, 'app/react/index.js'),
      nprogress: path.join(rootPath, 'node_modules/nprogress/nprogress.js'),
      'pdf.worker': path.join(rootPath, 'node_modules/pdfjs-dist/build/pdf.worker.entry'),
    },
    output: {
      path: path.join(rootPath, '/dist/'),
      publicPath: '/',
      filename: '[name]'+jsChunkHashName+'.js'
    },
    resolveLoader: {
      modules: ['node_modules', __dirname + '/webpackLoaders'],
      extensions: ['.js', '.json'],
      mainFields: ['loader', 'main']
    },
    module: {
      rules: [
        {
          test: /world-countries/,
          loader: 'country-loader'
        },
        {
          test: /\.js$/,
          loader: 'babel-loader?cacheDirectory',
          include: path.join(rootPath, 'app'),
          exclude: /node_modules/
        },
        {
          test: /\.scss$/,
          use: ['css-hot-loader'].concat(CoreCss.extract({
            fallback: 'style-loader',
            use: 'css-loader?sourceMap!sass-loader?outputStyle=expanded&sourceMap=true&sourceMapContents=true'
          })),
          include: [
            path.join(rootPath, 'app'),
            path.join(rootPath, 'node_modules/react-widgets/lib/scss/')
          ]
        },
        {
          test: /\.css$/,
          loader: CoreCss.extract({
            fallback: 'style-loader',
            use: 'css-loader?sourceMap'
          }),
          include: [
            path.join(rootPath, 'app')
          ]
        },
        {
          test: /\.css$/,
          loader: VendorCSS.extract({
            fallback: 'style-loader',
            use: 'css-loader?sourceMap'
          }),
          include: [
            path.join(rootPath, 'node_modules/react-datepicker/dist/'),
            path.join(rootPath, 'node_modules/bootstrap/dist/'),
            path.join(rootPath, 'node_modules/nprogress/'),
            path.join(rootPath, 'node_modules/font-awesome/css/'),
            path.join(rootPath, 'node_modules/pdfjs-dist/web')
          ]
        },
        {
          test: /\.(jpe?g|png|eot|woff|woff2|ttf|gif|svg)(\?.*)?$/i,
          loaders: ['url-loader', 'img-loader'],
          include: [
            path.join(rootPath, 'public'),
            path.join(rootPath, 'app'),
            path.join(rootPath, 'node_modules/react-widgets/lib/fonts/'),
            path.join(rootPath, 'node_modules/font-awesome/fonts/'),
            path.join(rootPath, 'node_modules/react-widgets/lib/img/'),
            path.join(rootPath, 'node_modules/pdfjs-dist/web/images/'),
            path.join(rootPath, 'node_modules/pdfjs-dist/web/images/'),
            path.join(rootPath, 'node_modules/bootstrap/dist/fonts/')
          ]
        },
        {
          test:/\.json$/i,
          loaders: ['json-loader'],
          include: [
            path.join(rootPath, 'app')
          ]
        }
      ]
    },
    plugins: [
      new CopyWebpackPlugin([
        {from: 'node_modules/react-flags/vendor/flags', to: 'flags'},
      ]),
      new CleanPlugin(__dirname + '/../dist/'),
      VendorCSS,
      CoreCss,
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        chunks: ["main"],
        minChunks: ({ resource }) => {
          if (/pdfjs/.test(resource)) {
            return false;
          }

          if (/.js$/.test(resource)) {
            return /node_modules/.test(resource)
          }
        },
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: 'manifest',
        chunks: ["main", "vendor", "nprogress"],
        minChunks: Infinity
      }),
      assetsPluginInstance
    ]
  };
}
