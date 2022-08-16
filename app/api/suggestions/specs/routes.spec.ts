/* eslint-disable max-lines */
import request from 'supertest';
import { Application, NextFunction, Request, Response } from 'express';
import entities from 'api/entities';

import { search } from 'api/search';
import { WithId } from 'api/odm';
import { suggestionsRoutes } from 'api/suggestions/routes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import {
  fixtures,
  shared2enId,
  shared2esId,
  shared6enId,
  suggestionSharedId6Enemy,
  suggestionSharedId6Title,
} from 'api/suggestions/specs/fixtures';
import { setUpApp } from 'api/utils/testingRoutes';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { EntitySchema } from 'shared/types/entityType';

jest.mock(
  '../../utils/languageMiddleware.ts',
  () => (req: Request, _res: Response, next: NextFunction) => {
    req.language = 'en';
    next();
  }
);

jest.mock('api/services/informationextraction/InformationExtraction', () => ({
  InformationExtraction: class IXMock {
    status = jest.fn().mockResolvedValue({ status: 'ready' });

    trainModel = jest.fn().mockResolvedValue({ status: 'processing' });
  },
}));

describe('suggestions routes', () => {
  let user: { username: string; role: string } | undefined;
  const getUser = () => user;

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });
  beforeEach(async () => {
    user = { username: 'user 1', role: 'admin' };
    spyOn(search, 'indexEntities').and.callFake(async () => Promise.resolve());
  });

  const app: Application = setUpApp(
    suggestionsRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = getUser();
      next();
    }
  );

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET /api/suggestions', () => {
    it('should return the suggestions filtered by the request language and the property name', async () => {
      const response = await request(app)
        .get('/api/suggestions')
        .query({ filter: { propertyName: 'super_powers' } })
        .expect(200);
      expect(response.body.suggestions).toMatchObject([
        {
          entityId: shared2esId.toString(),
          sharedId: 'shared2',
          entityTitle: 'Batman es',
          propertyName: 'super_powers',
          suggestedValue: 'scientific knowledge es',
          segment: 'el confía en su propio conocimiento científico',
          state: SuggestionState.labelMismatch,
          language: 'es',
          page: 5,
        },
        {
          entityId: shared2enId.toString(),
          sharedId: 'shared2',
          entityTitle: 'Batman en',
          propertyName: 'super_powers',
          suggestedValue: 'scientific knowledge',
          segment: 'he relies on his own scientific knowledge',
          state: SuggestionState.labelMatch,
          language: 'en',
          page: 5,
        },
      ]);
      expect(response.body.totalPages).toBe(1);
    });

    it('should include failed suggestions but not processing ones', async () => {
      const response = await request(app)
        .get('/api/suggestions')
        .query({ filter: { propertyName: 'age' } })
        .expect(200);
      expect(response.body.suggestions).toMatchObject(
        expect.arrayContaining([
          expect.objectContaining({
            entityTitle: 'Joker',
            propertyName: 'age',
            segment: 'Joker age is 45',
            sharedId: 'shared4',
            state: 'Error',
            suggestedValue: null,
          }),
        ])
      );
      expect(response.body.suggestions).not.toMatchObject(
        expect.arrayContaining([
          expect.objectContaining({
            entityTitle: 'Alfred',
            propertyName: 'age',
            segment: 'Alfred 67 years old processing',
            currentValue: 23,
            sharedId: 'shared3',
            state: 'Mismatch / Value',
          }),
        ])
      );
    });

    describe('pagination', () => {
      it('should return the requested page sorted by date by default', async () => {
        const response = await request(app)
          .get('/api/suggestions/')
          .query({ filter: { propertyName: 'title' }, page: { number: 2, size: 2 } })
          .expect(200);
        expect(response.body.suggestions).toMatchObject([
          { entityTitle: 'Alfred' },
          { entityTitle: 'Robin' },
        ]);
        expect(response.body.totalPages).toBe(3);
      });

      it.each([
        { number: -2, size: 2 },
        { number: 2, size: -2 },
        { number: 2, size: 1000 },
      ])('should handle invalid pagination params', async page => {
        await request(app)
          .get('/api/suggestions/')
          .query({ filter: { propertyName: 'title' }, page })
          .expect(400);
      });
    });

    describe('filtering', () => {
      it('should filter by state', async () => {
        const response = await request(app)
          .get('/api/suggestions/')
          .query({ filter: { propertyName: 'enemy', state: SuggestionState.empty } })
          .expect(200);
        expect(response.body.suggestions).toEqual([
          expect.objectContaining({
            entityTitle: 'The Penguin',
            state: SuggestionState.empty,
            suggestedValue: '',
            currentValue: '',
          }),
        ]);
      });
    });

    describe('validation', () => {
      it('should return a validation error if params are not valid', async () => {
        const invalidQuery = { additionParam: true };
        const response = await request(app).get('/api/suggestions/').query(invalidQuery);
        expect(response.status).toBe(400);
      });
    });

    describe('authentication', () => {
      it('should reject with unauthorized when user has not admin role', async () => {
        user = { username: 'user 1', role: 'editor' };
        const response = await request(app).get('/api/suggestions/').query({}).expect(401);
        expect(response.unauthorized).toBe(true);
      });
    });
  });

  describe('GET /api/suggestions/status', () => {
    it('should return the status of the IX process', async () => {
      const response = await request(app)
        .get('/api/suggestions/status')
        .query({ property: 'super_powers' })
        .expect(200);

      expect(response.body).toMatchObject({ status: 'ready' });
    });
    it('should reject with unauthorized when user has not admin role', async () => {
      user = { username: 'user 1', role: 'editor' };
      const response = await request(app)
        .get('/api/suggestions/status')
        .query({ property: 'super_powers' })
        .expect(401);
      expect(response.unauthorized).toBe(true);
    });
  });

  describe('POST /api/suggestions/train', () => {
    it('should return the status of the IX process', async () => {
      const response = await request(app)
        .post('/api/suggestions/train')
        .send({ property: 'super_powers' })
        .expect(200);

      expect(response.body).toMatchObject({ status: 'processing' });
    });
    it('should reject with unauthorized when user has not admin role', async () => {
      user = { username: 'user 1', role: 'editor' };
      const response = await request(app)
        .post('/api/suggestions/train')
        .send({ property: 'super_powers' })
        .expect(401);
      expect(response.unauthorized).toBe(true);
    });
  });

  describe('POST /api/suggestions/accept', () => {
    it('should update the suggestion for title in one language', async () => {
      await request(app)
        .post('/api/suggestions/accept')
        .send({
          suggestion: {
            _id: suggestionSharedId6Title,
            sharedId: 'shared6',
            entityId: shared6enId,
          },
          allLanguages: false,
        })
        .expect(200);

      const actualEntities = await entities.get({ sharedId: 'shared6' });
      expect(actualEntities).toMatchObject([
        {
          title: 'The Penguin',
        },
        {
          title: 'Penguin',
        },
        {
          title: 'The Penguin',
        },
      ]);
      expect(search.indexEntities).toHaveBeenCalledWith(
        { _id: { $in: [shared6enId] } },
        '+fullText'
      );
    });
    it('should update the suggestion for all the languages', async () => {
      await request(app)
        .post('/api/suggestions/accept')
        .send({
          allLanguages: true,
          suggestion: {
            _id: suggestionSharedId6Enemy,
            sharedId: 'shared6',
            entityId: shared6enId,
          },
        })
        .expect(200);

      const actualEntities = await entities.get({ sharedId: 'shared6' });
      expect(actualEntities).toMatchObject([
        {
          metadata: { enemy: [{ value: 'Batman' }], age: [{ value: 40 }] },
        },
        {
          metadata: { enemy: [{ value: 'Batman' }], age: [{ value: 40 }] },
        },
        {
          metadata: { enemy: [{ value: 'Batman' }], age: [{ value: 40 }] },
        },
      ]);
      const entityIds = actualEntities.map((e: WithId<EntitySchema>) => e._id);
      expect(search.indexEntities).toHaveBeenCalledWith(
        { _id: { $in: expect.arrayContaining(entityIds) } },
        '+fullText'
      );
    });
    it('should reject with unauthorized when user has not admin role', async () => {
      user = { username: 'user 1', role: 'editor' };
      const response = await request(app)
        .post('/api/suggestions/accept')
        .send({
          allLanguages: true,
          suggestion: {
            _id: suggestionSharedId6Enemy,
            sharedId: 'shared6',
            entityId: shared6enId,
          },
        })
        .expect(401);
      expect(response.unauthorized).toBe(true);
    });
  });
});
