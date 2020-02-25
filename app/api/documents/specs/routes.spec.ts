import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import db from 'api/utils/testing_db';

import fixtures, { document1 } from './fixtures';

import { setUpApp } from 'api/utils/testingRoutes';
import { documentRoutes } from '../routes';

jest.mock(
  '../../auth/authMiddleware.js',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('document routes', () => {
  const app: Application = setUpApp(documentRoutes);

  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => db.disconnect());

  describe('GET/page', () => {
    it('should return raw page', async () => {
      let res: SuperTestResponse = await request(app)
        .get('/api/documents/page')
        .query({ _id: document1.toString(), page: '1' });

      expect(res.body).toEqual({ data: 'page 1' });

      res = await request(app)
        .get('/api/documents/page')
        .query({ _id: document1.toString(), page: '2' });

      expect(res.body).toEqual({ data: 'page 2' });
    });

    it('should return an error when pages does not exists', async () => {
      const res: SuperTestResponse = await request(app)
        .get('/api/documents/page')
        .query({ _id: document1.toString(), page: 'unexistent' });

      expect(res.body).toEqual(
        expect.objectContaining({
          error: 'page does not exists',
        })
      );
    });

    it('should return error when file does not exists', async () => {
      const res: SuperTestResponse = await request(app)
        .get('/api/documents/page')
        .query({ _id: db.id().toString() });

      expect(res.body).toEqual(
        expect.objectContaining({
          error: 'document does not exists',
        })
      );
    });
  });
});
