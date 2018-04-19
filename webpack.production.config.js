/* eslint-disable */
'use strict';
process.env.NODE_ENV = 'production';
var path = require('path');
var webpack = require('webpack');
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var CompressionPlugin = require('compression-webpack-plugin');

var production = true;
var config = require('./webpack/config')(production);

config.devtool = 'cheap-module-source-map';
config.context = __dirname;
config.plugins = config.plugins.concat([
  new webpack.optimize.ModuleConcatenationPlugin(),
  new webpack.optimize.OccurrenceOrderPlugin(),
  new OptimizeCssAssetsPlugin(),
  new webpack.optimize.UglifyJsPlugin({
    compressor: {
      warnings: false,
      screw_ie8: true,
      comparisons: false
    }
  }),
  new webpack.optimize.AggressiveMergingPlugin(),
  new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify('production') } })
])

module.exports = config;
