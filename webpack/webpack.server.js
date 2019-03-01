/* eslint-disable import/no-extraneous-dependencies */

const webpack = require('webpack');

const express = require('express');

const app = express();
const http = require('http').Server(app);

const httpRequest = require('http');
// TEMP
const rtlcss = require('rtlcss');
const webpackConfig = require('./webpack.config.hot');

const compiler = webpack(webpackConfig);


app.use(require('webpack-dev-middleware')(compiler, {
  logLevel: 'error',
  publicPath: webpackConfig.output.publicPath,
  headers: { 'Access-Control-Allow-Origin': '*' }
}));

app.use(require('webpack-hot-middleware')(compiler));

// TEMP RTL

app.get('/CSS/:file', (req, res) => {
  const request = httpRequest.request({ host: 'localhost', port: 8080, path: `/${req.params.file}` }, (response) => {
    let data = '';
    response.on('data', (chunk) => {
      data += chunk;
    });
    response.on('end', () => {
      if (req.query.rtl === 'true') {
        console.log('Processing RTL...');
        data = rtlcss.process(data);
        console.log('Done!');
      } else {
        console.log('Using standard CSS.');
      }
      res.end(data);
    });
  });

  request.on('error', (e) => {
    console.log(e.message);
  });

  request.end();
});

// -----------

http.listen(8080);
