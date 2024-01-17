/* eslint-disable import/no-extraneous-dependencies */

import webpack from 'webpack';
import express from 'express';
import cors from 'cors';

import _http, { request as _request } from 'http';
// TEMP
import { process as _process } from 'rtlcss';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import * as webpackConfig from './webpack.config.hot.mjs';

const app = express();
app.use(cors());

const http = _http.Server(app);

const compiler = webpack(webpackConfig.default);

app.use(
  webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    headers: { 'Access-Control-Allow-Origin': '*' },
    stats: 'errors-warnings',
  })
);

app.use(webpackHotMiddleware(compiler));

app.get('/CSS/:file', (req, res) => {
  const request = _request(
    { host: 'localhost', port: 8080, path: `/${req.params.file}` },
    response => {
      let data = '';
      response.on('data', chunk => {
        data += chunk;
      });
      response.on('end', () => {
        if (req.query.rtl === 'true') {
          process.stdout.write('Processing RTL...\r\n');
          data = _process(data);
          process.stdout.write('Done!\r\n');
        } else {
          process.stdout.write('Using standard CSS.\r\n');
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
