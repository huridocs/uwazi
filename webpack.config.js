'use strict';

var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: '#source-map',
  entry: [
    path.join(__dirname, 'app/react/index.js')
  ],
  output: {
    path: path.join(__dirname, '/dist/'),
    filename: 'bundle.js'
  },
  plugins: [],
  module: {
    loaders: [{
      test: /\.js?$/,
      loader: 'babel-loader',
      include: path.join(__dirname, 'app'),
      query: {
        stage: 0,
        cacheDirectory: true
      }
    }, {
      test: /\.scss$/,
      loaders: ['style', 'css?sourceMap', 'sass?sourceMap'],
      include: path.join(__dirname, 'app')
    },  {
      test: /\.(jpe?g|png|eot|woff|ttf|gif|svg)(\?.*)?$/i,
      loader: 'file-loader',
      include: path.join(__dirname, 'app')
    }]
  }
};
