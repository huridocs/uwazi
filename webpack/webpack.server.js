/* eslint-disable import/no-extraneous-dependencies */

import webpack from 'webpack';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import { createHotRtlCssHandler, registerHotWebpackRoutes } from './hotRtlCss.js';

const webpackPort = Number(process.env.WEBPACK_PORT || 8080);

void (async () => {
  // Load webpack config dynamically since it's CommonJS
  const webpackConfig = await import('./webpack.config.hot.cjs');

  const app = express();
  app.use(cors());

  const http = createServer(app);

  const compiler = webpack(webpackConfig.default);

  compiler.hooks.watchRun.tap('DebugWatchRun', comp => {
    const changed = comp.modifiedFiles ? Array.from(comp.modifiedFiles) : [];
    const removed = comp.removedFiles ? Array.from(comp.removedFiles) : [];
    if (changed.length > 0 || removed.length > 0) {
      process.stdout.write('[webpack] rebuild triggered by:\n');
      changed.forEach(f => process.stdout.write(`  [changed] ${f}\n`));
      removed.forEach(f => process.stdout.write(`  [removed] ${f}\n`));
    } else {
      process.stdout.write(
        '[webpack] rebuild triggered (no modifiedFiles reported — likely initial or forced)\n'
      );
    }
  });

  const middleware = webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.default.output.publicPath,
    headers: { 'Access-Control-Allow-Origin': '*' },
    stats: 'errors-warnings',
    writeToDisk: filePath => {
      const normalizedPath = filePath.replace(/\\/g, '/');
      return (
        normalizedPath.endsWith('.css') ||
        normalizedPath.endsWith('dataviz-embed.js') ||
        normalizedPath.includes('webpack-assets.json') ||
        normalizedPath.includes('/CSS/') ||
        normalizedPath.includes('/pdfjs_wasm/') ||
        normalizedPath.includes('/legacy_character_maps/')
      );
    },
  });

  registerHotWebpackRoutes(app, {
    rtlCssHandler: createHotRtlCssHandler({
      waitUntilValid: callback => middleware.waitUntilValid(callback),
      outputFileSystem: compiler.outputFileSystem,
      outputPath: webpackConfig.default.output.path,
    }),
    webpackDevMiddleware: middleware,
    webpackHotMiddleware: webpackHotMiddleware(compiler),
  });

  http.listen(webpackPort);
})();
