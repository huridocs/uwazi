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
        {
          entityTitle: 'Entity 1',
          propertyName: 'title',
          currentValue: 'wrong data',
          suggestedValue: 'HCT-04-CR-SC-0074',
        },
        {
          entityTitle: 'Entity 2',
          propertyName: 'property_1',
          suggestedValue: 'first suggestion',
        },
      ]);
    });
  });
});
