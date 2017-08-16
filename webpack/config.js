/* eslint-disable */
'use strict';

var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var rootPath = __dirname + '/../';

module.exports = {
  context: rootPath,
  devtool: '#eval-source-map',
  entry: {
    main: path.join(rootPath, 'app/react/index.js'),
    'pdf.worker': path.join(rootPath, 'node_modules/pdfjs-dist/build/pdf.worker.entry'),
  },
  output: {
    path: path.join(rootPath, '/dist/'),
    publicPath: '/',
    filename: '[name].bundle.js'
  },
  resolveLoader: {
    modules: ['node_modules', 'webpackLoaders'],
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
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader?sourceMap!sass-loader?outputStyle=expanded&sourceMap=true&sourceMapContents=true'
        }),
        include: [
          path.join(rootPath, 'app'),
          path.join(rootPath, 'node_modules/react-widgets/lib/scss/')
        ]
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader?sourceMap'
        }),
        include: [
          path.join(rootPath, 'app'),
          path.join(rootPath, 'node_modules/react-datepicker/dist/'),
          path.join(rootPath, 'node_modules/bootstrap/dist/'),
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
          //path.join(rootPath, 'node_modules')
        ]
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin("style.css")
  ]
};
