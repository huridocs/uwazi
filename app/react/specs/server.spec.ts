import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';

import { EntryServer } from '#app/entry-server.js';
import { serverSideRender } from '#app/server.js';

jest.mock('#app/entry-server.js', () => ({ EntryServer: jest.fn() }));

const entryServer = jest.mocked(EntryServer);

const appWithErrorHandler = (handled: unknown[]) => {
  const app = express();
  serverSideRender(app);
  // eslint-disable-next-line max-params -- express only treats a 4-argument function as an error handler
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    handled.push(error);
    res.status(500).json({ error: 'handled' });
  });
  return app;
};

describe('serverSideRender', () => {
  beforeEach(() => {
    entryServer.mockReset();
  });

  it('should hand an error thrown while rendering to the express error handler', async () => {
    const failure = new Error('render failed');
    entryServer.mockRejectedValue(failure);
    const handled: unknown[] = [];

    const response = await request(appWithErrorHandler(handled)).get('/en/library');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'handled' });
    expect(handled).toEqual([failure]);
  });

  it('should leave a successful render alone', async () => {
    entryServer.mockImplementation(async (_req, res) => {
      res.status(200).send('<html></html>');
    });
    const handled: unknown[] = [];

    const response = await request(appWithErrorHandler(handled)).get('/en/library');

    expect(response.status).toBe(200);
    expect(response.text).toBe('<html></html>');
    expect(handled).toEqual([]);
  });
});
