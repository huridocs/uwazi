import express from 'express';
import request from 'supertest';
import { createHotRtlCssHandler, registerHotWebpackRoutes } from '../../webpack/hotRtlCss.js';

const ltrCss = '.box { margin-left: 10px; }';

const createHandler = () =>
  createHotRtlCssHandler({
    waitUntilValid: callback => callback(),
    outputFileSystem: {
      existsSync: () => true,
      readFileSync: () => ltrCss,
    },
    outputPath: '/dist',
  });

const serveLtrCss = (_req, res) => {
  res.type('css').send(ltrCss);
};

const passthrough = (_req, _res, next) => {
  next();
};

describe('hot RTL CSS', () => {
  it('should process CSS with rtlcss when rtl=true', async () => {
    const app = express();
    app.get('/CSS/:file', createHandler());

    const response = await request(app).get('/CSS/main.css?rtl=true');

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/css');
    expect(response.text).toContain('margin-right');
    expect(response.text).not.toContain('margin-left');
  });

  it('should handle rtl CSS before webpack-dev-middleware', async () => {
    const app = express();
    registerHotWebpackRoutes(app, {
      rtlCssHandler: createHandler(),
      webpackDevMiddleware: serveLtrCss,
      webpackHotMiddleware: passthrough,
    });

    const response = await request(app).get('/CSS/main.css?rtl=true');

    expect(response.text).toContain('margin-right');
    expect(response.text).not.toContain('margin-left');
  });

  it('should fall through to webpack-dev-middleware without an rtl query', async () => {
    const app = express();
    registerHotWebpackRoutes(app, {
      rtlCssHandler: createHandler(),
      webpackDevMiddleware: serveLtrCss,
      webpackHotMiddleware: passthrough,
    });

    const response = await request(app).get('/CSS/main.css');

    expect(response.text).toContain('margin-left');
  });
});
