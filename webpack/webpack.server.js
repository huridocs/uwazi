/* eslint-disable import/no-extraneous-dependencies */

import webpack from 'webpack';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import httpRequest from 'http';
import rtlcss from 'rtlcss';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

(async () => {
  // Load webpack config dynamically since it's CommonJS
  const webpackConfig = await import('./webpack.config.hot.cjs');

  const app = express();
  app.use(cors());

  const http = createServer(app);

  const compiler = webpack(webpackConfig.default);

  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: webpackConfig.default.output.publicPath,
      headers: { 'Access-Control-Allow-Origin': '*' },
      stats: 'errors-warnings',
    })
  );

  app.use(webpackHotMiddleware(compiler));

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
})();
