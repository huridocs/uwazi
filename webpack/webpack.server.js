/* eslint-disable import/no-extraneous-dependencies */

import webpack from 'webpack';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import rtlcss from 'rtlcss';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  // Load webpack config dynamically since it's CommonJS
  const webpackConfig = await import('./webpack.config.hot.cjs');

  const app = express();
  app.use(cors());

  const http = createServer(app);

  const compiler = webpack(webpackConfig.default);

  const middleware = webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.default.output.publicPath,
    headers: { 'Access-Control-Allow-Origin': '*' },
    stats: 'errors-warnings',
    writeToDisk: (filePath) => {
      const normalizedPath = filePath.replace(/\\/g, '/');
      return normalizedPath.endsWith('.css') ||
        normalizedPath.includes('webpack-assets.json') ||
        normalizedPath.includes('/CSS/');
    },
  });

  app.use(middleware);

  app.get('/CSS/:file', (req, res, next) => {
    if (req.query.rtl !== 'true') {
      return next();
    }

    const filename = `CSS/${req.params.file}`;

    middleware.waitUntilValid(() => {
      try {
        const outputFs = compiler.outputFileSystem;
        const outputPath = webpackConfig.default.output.path;
        const filePath = path.join(outputPath, filename);

        if (!outputFs || !outputFs.existsSync || !outputFs.existsSync(filePath)) {
          return next();
        }

        const file = outputFs.readFileSync(filePath, 'utf8');
        process.stdout.write('Processing RTL...\r\n');
        const processed = rtlcss.process(file);
        process.stdout.write('Done!\r\n');
        res.setHeader('Content-Type', 'text/css');
        res.end(processed);
      } catch (error) {
        next(error);
      }
    });
  });
  app.use(webpackHotMiddleware(compiler));

  http.listen(8080);
})();
