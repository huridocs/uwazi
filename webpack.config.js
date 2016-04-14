/* eslint-disable */
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
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: path.join(__dirname, 'app')
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css?sourceMap!sass-loader?outputStyle=expanded&sourceMap=true&sourceMapContents=true'),
        include: [path.join(__dirname, 'app'),path.join(__dirname, 'node_modules')]
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract("style-loader", "css?sourceMap"),
        include: [path.join(__dirname, 'app'), path.join(__dirname, 'node_modules')]
      },
      {
        test: /\.(jpe?g|png|eot|woff|woff2|ttf|gif|svg)(\?.*)?$/i,
        loaders: ['url-loader', 'img'],
        include: [path.join(__dirname, 'app'), path.join(__dirname, 'node_modules')]
      }
    ]
  },
  plugins: [
      new ExtractTextPlugin("style.css")
  ]
};
