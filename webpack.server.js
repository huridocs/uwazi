const webpack = require('webpack');
const webpackConfig = require('./webpack.config');
const compiler = webpack(webpackConfig);
const express = require('express');
const app = express();
const http = require('http').Server(app);

app.use(require('webpack-dev-middleware')(compiler, {
  logLevel: 'error',
  publicPath: webpackConfig.output.publicPath,
  headers: {'Access-Control-Allow-Origin': '*'}
}));

app.use(require('webpack-hot-middleware')(compiler));

http.listen(8080);


