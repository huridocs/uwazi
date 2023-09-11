import { Application, NextFunction } from 'express';
import request from 'supertest';

import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import { expectedLinks, linkFixtures } from './fixtures';
import settingsRoutes from '../routes';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

const app: Application = setUpApp(settingsRoutes);

const getFixtures: DBFixture = linkFixtures;

afterAll(async () => testingEnvironment.tearDown());

describe('api/settings/links', () => {
  describe('GET', () => {
    it('should respond with links', async () => {
      await testingEnvironment.setUp(getFixtures);
      const response = await request(app).get('/api/settings/links').expect(200);
      expect(response.body).toEqual(expectedLinks);
    });
  });
});
