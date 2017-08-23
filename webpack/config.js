/* eslint-disable */
'use strict';

var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CleanPlugin = require('./CleanPlugin');

var rootPath = __dirname + '/../';

const extractNprogressCSS = new ExtractTextPlugin('nprogress.css');
const CoreCss = new ExtractTextPlugin('style.css');

module.exports = {
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
    filename: '[name].bundle.js'
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
        loader: CoreCss.extract({
          fallback: 'style-loader',
          use: 'css-loader?sourceMap!sass-loader?outputStyle=expanded&sourceMap=true&sourceMapContents=true'
        }),
        include: [
          path.join(rootPath, 'app'),
          path.join(rootPath, 'node_modules/react-widgets/lib/scss/')
        ]
      },
      {
        test: /nprogress\.css$/,
        loader: extractNprogressCSS.extract({
          fallback: 'style-loader',
          use: 'css-loader?sourceMap'
        }),
        include: [
          path.join(rootPath, 'app'),
          path.join(rootPath, 'node_modules/nprogress/')
        ]
      },
      {
        test: /\.css$/,
        loader: CoreCss.extract({
          fallback: 'style-loader',
          use: 'css-loader?sourceMap'
        }),
        include: [
          path.join(rootPath, 'app'),
          path.join(rootPath, 'node_modules/react-datepicker/dist/'),
          path.join(rootPath, 'node_modules/bootstrap/dist/'),
          path.join(rootPath, 'node_modules/font-awesome/css/'),
          path.join(rootPath, 'node_modules/pdfjs-dist/web'),
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
    new CleanPlugin(__dirname + '/../dist/'),
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
      chunks: ["main", "vendor", "nprogress", "pdf.worker"],
      minChunks: Infinity
    }),
    CoreCss,
    extractNprogressCSS,
    new webpack.optimize.ModuleConcatenationPlugin()
  ]
};
