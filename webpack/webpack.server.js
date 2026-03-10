/* eslint-disable import/no-extraneous-dependencies */

const webpack = require('webpack');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const http = require('http').Server(app);

const httpRequest = require('http');
// TEMP
const rtlcss = require('rtlcss');
const webpackConfig = require('./webpack.config.hot');

const compiler = webpack(webpackConfig);

app.use(
  require('webpack-dev-middleware')(compiler, {
    publicPath: webpackConfig.output.publicPath,
    headers: { 'Access-Control-Allow-Origin': '*' },
    stats: 'errors-warnings',
  })
);

app.use(require('webpack-hot-middleware')(compiler));

app.get('/CSS/:file', (req, res) => {
  const request = httpRequest.request(
    { host: 'localhost', port: 8080, path: `/${req.params.file}` },
    response => {
      let data = '';
      response.on('data', chunk => {
        data += chunk;
      });
      response.on('end', () => {
        if (req.query.rtl === 'true') {
          process.stdout.write('Processing RTL...\r\n');
          data = rtlcss.process(data);
          process.stdout.write('Done!\r\n');
        }
        res.end(data);
      });
    }
  );

  request.on('error', e => {
    process.stdout.write(`${e.message}\r\n`);
  });

  request.end();
});

http.listen(8080);
