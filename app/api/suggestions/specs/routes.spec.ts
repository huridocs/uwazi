import request from 'supertest';
import { Application, NextFunction, Request, Response } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { suggestionsRoutes } from 'api/suggestions/routes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fixtures } from 'api/suggestions/specs/fixtures';
import { SuggestionState } from 'shared/types/suggestionSchema';

jest.mock(
  '../../utils/languageMiddleware.ts',
  () => (req: Request, _res: Response, next: NextFunction) => {
    req.language = 'en';
    next();
  }
);

describe('suggestions routes', () => {
  let user: { username: string; role: string } | undefined;
  const getUser = () => user;

  beforeAll(async () => {
    user = { username: 'user 1', role: 'admin' };

    await testingEnvironment.setUp(fixtures);
  });

  const app: Application = setUpApp(
    suggestionsRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = getUser();
      next();
    }
  );

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET', () => {
    it('should return the suggestions filtered by the request language and the property name', async () => {
      const response = await request(app)
        .get('/api/suggestions')
        .query({ filter: { propertyName: 'super_powers' } });
      expect(response.body.suggestions).toMatchObject([
        {
          entityTitle: 'Batman',
          propertyName: 'super_powers',
          suggestedValue: 'conocimiento científico',
          segment: 'el confía en su propio conocimiento científico',
          state: 'Pending',
          language: 'es',
        },
        {
          entityTitle: 'Batman',
          propertyName: 'super_powers',
          suggestedValue: 'scientific knowledge',
          segment: 'he relies on his own scientific knowledge',
          state: 'Matching',
          language: 'en',
        },
      ]);
      expect(response.body.totalPages).toBe(1);
    });

    describe('pagination', () => {
      it('should return the requested page sorted by date by default', async () => {
        const response = await request(app)
          .get('/api/suggestions/')
          .query({ filter: { propertyName: 'title' }, page: { number: 2, size: 2 } });
        expect(response.body.suggestions).toMatchObject([
          { entityTitle: 'Alfred' },
          { entityTitle: 'Robin' },
        ]);
        expect(response.body.totalPages).toBe(3);
      });
    });

    describe('filtering', () => {
      it('should filter by state', async () => {
        const response = await request(app)
          .get('/api/suggestions/')
          .query({ filter: { propertyName: 'age', state: SuggestionState.empty } });
        expect(response.body.suggestions).toMatchObject([
          { entityTitle: 'Alfred' },
          { entityTitle: 'Joker' },
        ]);
      });
    });

    describe('validation', () => {
      it('should return a validation error if params are not valid', async () => {
        const invalidQuery = { additionParam: true };
        const response = await request(app)
          .get('/api/suggestions/')
          .query(invalidQuery);
        expect(response.status).toBe(400);
      });
    });

    describe('authentication', () => {
      it('should reject with unauthorized when user has not admin role', async () => {
        user = { username: 'user 1', role: 'editor' };
        const response = await request(app)
          .get('/api/suggestions/')
          .query({});
        expect(response.unauthorized).toBe(true);
      });
    });
  });
});
