/* eslint-disable import/no-extraneous-dependencies */

const webpack = require('webpack');

const express = require('express');

const app = express();
const http = require('http').Server(app);

const webpackConfig = require('./webpack.config.hot');

const compiler = webpack(webpackConfig);


app.use(require('webpack-dev-middleware')(compiler, {
  logLevel: 'error',
  publicPath: webpackConfig.output.publicPath,
  headers: { 'Access-Control-Allow-Origin': '*' }
}));

app.use(require('webpack-hot-middleware')(compiler));

http.listen(8080);
