import request from 'supertest';
import { Application, NextFunction, Request, Response } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { suggestionsRoutes } from 'api/suggestions/routes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fixtures } from 'api/suggestions/specs/fixtures';

jest.mock(
  '../../utils/languageMiddleware.ts',
  () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('suggestions routes', () => {
  const app: Application = setUpApp(suggestionsRoutes);

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('GET', () => {
    it('should return the suggestions', async () => {
      const response = await request(app)
        .get('/api/suggestions')
        .query({});
      expect(response.body).toMatchObject([
        { title: 'Entity 1', propertyName: 'title' },
        {
          title: 'Entity 1',
          propertyName: 'property_1',
          currentValue: [{ value: 'value 1' }],
        },
      ]);
    });
  });
});
