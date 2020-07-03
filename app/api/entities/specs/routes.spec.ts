import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import db from 'api/utils/testing_db';
import { setUpApp } from 'api/utils/testingRoutes';

import fixtures from './fixtures';
import entitiesRoutes from '../routes';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('files routes', () => {
  const app: Application = setUpApp(entitiesRoutes);

  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });
  afterAll(async () => db.disconnect());


  describe('GET', () => {
    it('return pdfInfo if asked in the request', async () => {
      const response_withoutPdfInfo: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared' });

      expect(response_withoutPdfInfo.body.rows[0].documents[0].pdfInfo).toBe(undefined);

      const response_withPdfInfo: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared', withPdfInfo: true });

      const expectedPdfInfo = fixtures.files[2].pdfInfo;
      expect(response_withPdfInfo.body.rows[0].documents[0].pdfInfo).toEqual(expectedPdfInfo);
    });
  });
});
