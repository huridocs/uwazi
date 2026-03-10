/* eslint-disable max-statements */
import request from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { search } from 'api/search';
import { setUpApp } from 'api/utils/testingRoutes';

import { testingEnvironment } from 'api/utils/testingEnvironment';
import { routes } from '../routes';
import { thesauri } from '../thesauri';
import { fixtures } from './fixtures';

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
