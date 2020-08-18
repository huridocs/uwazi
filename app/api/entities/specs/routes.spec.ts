import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import db from 'api/utils/testing_db';
import { setUpApp } from 'api/utils/testingRoutes';

import fixtures from './fixtures';
import routes from 'api/entities/routes';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('entities routes', () => {
  const app: Application = setUpApp(routes);

  beforeEach(async () => {
    //@ts-ignore
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => db.disconnect());

  describe('GET', () => {
    it('return pdfInfo if asked in the request', async () => {
      const responseWithoutPdfInfo: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared' });

      expect(responseWithoutPdfInfo.body.rows[0].documents[0].pdfInfo).toBe(undefined);

      const responseWithPdfInfo: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared', withPdfInfo: true });

      const expectedPdfInfo = fixtures.files[2].pdfInfo;
      expect(responseWithPdfInfo.body.rows[0].documents[0].pdfInfo).toEqual(expectedPdfInfo);
    });
  });
});
