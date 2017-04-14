/* eslint-disable */
'use strict';

var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  context: __dirname,
  devtool: '#source-map',
  //entry: [
  //path.join(__dirname, 'app/react/index.js')
  //],
  entry: {
    main: path.join(__dirname, 'app/react/index.js'),
    'pdf.worker': path.join(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.entry'),
  },
  output: {
    path: path.join(__dirname, '/dist/'),
    publicPath: '/',
    filename: '[name].bundle.js'
  },
  module: {
    //noParse: /node_modules/,
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader?cacheDirectory',
        include: path.join(__dirname, 'app'),
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader?sourceMap!sass-loader?outputStyle=expanded&sourceMap=true&sourceMapContents=true'
        }),
        include: [
          path.join(__dirname, 'app'),
          path.join(__dirname, 'node_modules/react-widgets/lib/scss/')
        ]
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader?sourceMap'
        }),
        include: [
          path.join(__dirname, 'app'),
          path.join(__dirname, 'node_modules/react-datepicker/dist/'),
          path.join(__dirname, 'node_modules/bootstrap/dist/'),
          path.join(__dirname, 'node_modules/font-awesome/css/'),
          path.join(__dirname, 'node_modules/pdfjs-dist/web')
        ]
      },
      {
        test: /\.(jpe?g|png|eot|woff|woff2|ttf|gif|svg)(\?.*)?$/i,
        loaders: ['url-loader', 'img-loader'],
        include: [
          path.join(__dirname, 'public'), 
          path.join(__dirname, 'app'),
          path.join(__dirname, 'node_modules/react-widgets/lib/fonts/'),
          path.join(__dirname, 'node_modules/font-awesome/fonts/'),
          path.join(__dirname, 'node_modules/react-widgets/lib/img/'),
          path.join(__dirname, 'node_modules/pdfjs-dist/web/images/'),
          path.join(__dirname, 'node_modules/pdfjs-dist/web/images/'),
          path.join(__dirname, 'node_modules/bootstrap/dist/fonts/')
        ]
      },
      {
        test:/\.json$/i,
        loaders: ['json-loader'],
        include: [
          path.join(__dirname, 'app')
          //path.join(__dirname, 'node_modules')
        ]
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin("style.css")
  ]
};
