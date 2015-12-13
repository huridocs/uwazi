'use strict';

var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  devtool: '#source-map',
  entry: [
    path.join(__dirname, 'app/react/index.js')
  ],
  output: {
    path: path.join(__dirname, '/dist/'),
    filename: 'bundle.js'
  },
  plugins: [
    // new ExtractTextPlugin("styles.css")
  ],
  module: {
    loaders: [{
      test: /\.js?$/,
      loader: 'babel-loader',
      include: path.join(__dirname, 'app'),
      query: {
        stage: 0,
        cacheDirectory: true
      }
    },
    {
      test: /\.scss$/,
      loaders: ['style', 'css?sourceMap', 'sass?sourceMap'],
      include: path.join(__dirname, 'app')
    },
    {
      test: /\.css$/,
      loader: "style-loader!css-loader",
      include: [path.join(__dirname, 'app'), path.join(__dirname, 'node_modules')]
    },
    {
      test: /\.(jpe?g|png|eot|woff|ttf|gif|svg)(\?.*)?$/i,
      loader: 'file-loader',
      include: path.join(__dirname, 'app')
    }]
  }
};
