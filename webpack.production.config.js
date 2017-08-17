/* eslint-disable */
'use strict';

var path = require('path');
var webpack = require('webpack');
var del = require('del');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var CompressionPlugin = require('compression-webpack-plugin');

class CleanPlugin {
  constructor(options) {
    this.options = options;
  }

  apply () {
    del.sync(this.options);
  }
}

var config = require('./webpack/config');

config.devtool = 'cheap-module-source-map';
config.plugins = [
  new CleanPlugin(),
  new webpack.optimize.OccurrenceOrderPlugin(),
  new ExtractTextPlugin('style.css'),
  new OptimizeCssAssetsPlugin(),
  new webpack.optimize.UglifyJsPlugin({
    compressor: {
      warnings: false,
      screw_ie8: true
    }
  }),
  new webpack.optimize.AggressiveMergingPlugin(),
  new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify('production') } }),
  new CompressionPlugin({
    asset: "[path].gz[query]",
    algorithm: "gzip",
    test: /\.js$|\.css$|\.html$/,
    threshold: 10240,
    minRatio: 0.8
  })
];

module.exports = config;
