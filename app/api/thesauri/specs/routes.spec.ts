/* eslint-disable max-statements */
import request from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { search } from '#api/search/index.js';

import { setUpApp } from '#api/utils/testingRoutes.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { routes } from '#api/thesauri/routes.js';
import { thesauri } from '#api/thesauri/thesauri.js';
import { fixtures } from '#api/thesauri/specs/fixtures.js';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('Thesauri routes', () => {
  const app: Application = setUpApp(routes);

  beforeEach(async () => {
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('/api/thesauri', () => {
    it('should call thesauri.find with correct params', async () => {
      jest.spyOn(thesauri, 'find').mockImplementation(async () => Promise.resolve({ rows: [] }));

      await request(app).get('/api/thesauri').expect(200);
      expect(thesauri.find).toHaveBeenNthCalledWith(1, undefined);

      await request(app).get('/api/thesauri?_id=any_id').expect(200);
      expect(thesauri.find).toHaveBeenNthCalledWith(2, { _id: 'any_id' });
    });
  });
});
