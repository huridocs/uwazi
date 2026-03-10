import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { routesErrorHandler } from 'api/utils/routesErrorHandler';

describe('/api/remotepublic raw body', () => {
  it('does not run JSON parser and keeps raw body for proxy', async () => {
    const app = express();
    routesErrorHandler(app);

    const handler = (req: Request, res: Response, _next: NextFunction) => {
      const chunks: Uint8Array[] = [];
      req.on('data', chunk => chunks.push(chunk as Uint8Array));
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        res.json({ got: raw, contentType: req.headers['content-type'] });
      });
    };

    app.post('/api/remotepublic', handler);

    await request(app)
      .post('/api/remotepublic')
      .set('Content-Type', 'application/json')
      .send('{malformed')
      .expect(200)
      .expect(res => {
        expect(res.body.got).toBe('{malformed');
        expect(res.body.contentType).toBe('application/json');
      });
  });
});
