import request from 'supertest';
import { Application, NextFunction, Request, Response } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { suggestionsRoutes } from 'api/suggestions/routes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fixtures } from 'api/suggestions/specs/fixtures';

jest.mock(
  '../../utils/languageMiddleware.ts',
  () => (req: Request, _res: Response, next: NextFunction) => {
    req.language = 'en';
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
    it('should return the suggestions filtered by the request language and the property name', async () => {
      const response = await request(app)
        .get('/api/suggestions')
        .query({ propertyName: 'super powers' });
      expect(response.body.suggestions).toMatchObject([
        {
          entityTitle: 'Batman',
          propertyName: 'super powers',
          suggestedValue: 'scientific knowledge',
          language: 'en',
        },
      ]);
      expect(response.body.totalPages).toBe(1);
    });

    describe('pagination', () => {
      it('should return the requested page sorted by date by default', async () => {
        const response = await request(app)
          .get('/api/suggestions/')
          .query({ propertyName: 'title', page: 2, size: 2 });
        expect(response.body.suggestions).toMatchObject([{ entityTitle: 'The Penguin' }]);
        expect(response.body.totalPages).toBe(3);
      });
    });
  });
});
