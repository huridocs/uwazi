/* eslint-disable max-statements */
import request from 'supertest';
import { Application, NextFunction, Request, Response } from 'express';

import entities from 'api/entities';
import { WithId } from 'api/odm';
import { search } from 'api/search';
import {
  factory,
  fixtures,
  heroTemplateId,
  personTemplateId,
  shared2enId,
  shared2esId,
  shared6enId,
  suggestionSharedId6Enemy,
  suggestionSharedId6Title,
} from 'api/suggestions/specs/fixtures';
import { suggestionsRoutes } from 'api/suggestions/routes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import { EntitySchema } from 'shared/types/entityType';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { Suggestions } from '../suggestions';

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

const sortAggregateById = (array: { _id: string; count: number }[]) =>
  array.sort((a, b) => a._id.localeCompare(b._id));

describe('suggestions routes', () => {
  let user: { username: string; role: string } | undefined;
  const getUser = () => user;

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    await Suggestions.updateStates({});
  });
  beforeEach(async () => {
    user = { username: 'user 1', role: 'admin' };
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
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
        .query({
          filter: {
            extractorId: factory.id('super_powers_extractor').toString(),
          },
        })
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
      expect(response.body.aggregations).toMatchObject({
        template: [{ _id: personTemplateId.toString(), count: 2 }],
        state: [
          { _id: 'Match / Label', count: 1 },
          { _id: 'Mismatch / Label', count: 1 },
        ],
      });
    });

    it('should include failed suggestions but not processing ones', async () => {
      const response = await request(app)
        .get('/api/suggestions')
        .query({
          filter: {
            extractorId: factory.id('age_extractor').toString(),
          },
        })
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
          .query({
            filter: {
              extractorId: factory.id('title_extractor').toString(),
            },
            page: { number: 2, size: 2 },
          })
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
          .query({
            filter: {
              extractorId: factory.id('title_extractor').toString(),
            },
            page,
          })
          .expect(400);
      });
    });

    describe('filtering', () => {
      it('should filter by state', async () => {
        const response = await request(app)
          .get('/api/suggestions/')
          .query({
            filter: {
              extractorId: factory.id('enemy_extractor').toString(),
              states: [SuggestionState.empty],
            },
          })
          .expect(200);
        expect(response.body.suggestions).toEqual([
          expect.objectContaining({
            entityTitle: 'Catwoman',
            state: SuggestionState.empty,
            suggestedValue: '',
            currentValue: '',
          }),
        ]);
      });

      it('should filter by entity template', async () => {
        const response = await request(app)
          .get('/api/suggestions/')
          .query({
            filter: {
              extractorId: factory.id('title_extractor').toString(),
              entityTemplates: [personTemplateId.toString()],
            },
          })
          .expect(200);
        expect(response.body.suggestions).toMatchObject([
          {
            propertyName: 'title',
            entityTemplateId: personTemplateId.toString(),
            sharedId: 'shared4',
            language: 'en',
          },
          {
            propertyName: 'title',
            entityTemplateId: personTemplateId.toString(),
            sharedId: 'shared3',
            language: 'en',
          },
          {
            propertyName: 'title',
            entityTemplateId: personTemplateId.toString(),
            sharedId: 'shared1',
            language: 'en',
          },
          {
            propertyName: 'title',
            entityTemplateId: personTemplateId.toString(),
            sharedId: 'shared1',
            language: 'es',
          },
        ]);
      });
    });

    describe('aggregations', () => {
      it('should return aggregations', async () => {
        const response = await request(app)
          .get('/api/suggestions/')
          .query({
            filter: {
              extractorId: factory.id('title_extractor').toString(),
            },
          })
          .expect(200);
        expect(response.body.aggregations).toMatchObject({
          template: sortAggregateById([
            { _id: heroTemplateId.toString(), count: 2 },
            { _id: personTemplateId.toString(), count: 4 },
          ]),
          state: [
            { _id: SuggestionState.valueMatch, count: 2 },
            { _id: SuggestionState.valueMismatch, count: 4 },
          ],
        });
      });

      it('should return aggregations for a specific template', async () => {
        const response = await request(app)
          .get('/api/suggestions/')
          .query({
            filter: {
              extractorId: factory.id('title_extractor').toString(),
              entityTemplates: [heroTemplateId.toString()],
            },
          })
          .expect(200);
        expect(response.body.aggregations).toMatchObject({
          template: sortAggregateById([
            { _id: heroTemplateId.toString(), count: 2 },
            { _id: personTemplateId.toString(), count: 4 },
          ]),
          state: [
            { _id: SuggestionState.valueMatch, count: 1 },
            { _id: SuggestionState.valueMismatch, count: 1 },
          ],
        });
      });

      it('should return aggregations for a specific state', async () => {
        const response = await request(app)
          .get('/api/suggestions/')
          .query({
            filter: {
              extractorId: factory.id('title_extractor').toString(),
              states: [SuggestionState.valueMatch],
            },
          })
          .expect(200);
        expect(response.body.aggregations).toMatchObject({
          template: sortAggregateById([
            { _id: heroTemplateId.toString(), count: 1 },
            { _id: personTemplateId.toString(), count: 1 },
          ]),
          state: [
            { _id: SuggestionState.valueMatch, count: 2 },
            { _id: SuggestionState.valueMismatch, count: 4 },
          ],
        });
      });

      it('should return aggregations for a specific template and state', async () => {
        const response = await request(app)
          .get('/api/suggestions/')
          .query({
            filter: {
              extractorId: factory.id('title_extractor').toString(),
              entityTemplates: [heroTemplateId.toString()],
              states: [SuggestionState.valueMatch],
            },
          })
          .expect(200);
        expect(response.body.aggregations).toMatchObject({
          template: sortAggregateById([
            { _id: heroTemplateId.toString(), count: 1 },
            { _id: personTemplateId.toString(), count: 1 },
          ]),
          state: [
            { _id: SuggestionState.valueMatch, count: 1 },
            { _id: SuggestionState.valueMismatch, count: 1 },
          ],
        });
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
      it('should reject with unauthorized when the user does not have the admin role', async () => {
        user = { username: 'user 1', role: 'editor' };
        const response = await request(app).get('/api/suggestions/').query({}).expect(401);
        expect(response.unauthorized).toBe(true);
      });
    });
  });

  describe('POST /api/suggestions/status', () => {
    it('should return the status of the IX process', async () => {
      const response = await request(app)
        .post('/api/suggestions/status')
        .send({
          extractorId: factory.id('super_powers_extractor').toString(),
        })
        .expect(200);

      expect(response.body).toMatchObject({ status: 'ready' });
    });
    it('should reject with unauthorized when user has not admin role', async () => {
      user = { username: 'user 1', role: 'editor' };
      const response = await request(app)
        .post('/api/suggestions/status')
        .send({ extractorId: factory.id('super_powers_extractor').toString() })
        .expect(401);
      expect(response.unauthorized).toBe(true);
    });
  });

  describe('POST /api/suggestions/train', () => {
    it('should return the status of the IX process', async () => {
      const response = await request(app)
        .post('/api/suggestions/train')
        .send({ extractorId: factory.id('super_powers_extractor').toString() })
        .expect(200);

      expect(response.body).toMatchObject({ status: 'processing' });
    });
    it('should reject with unauthorized when user has not admin role', async () => {
      user = { username: 'user 1', role: 'editor' };
      const response = await request(app)
        .post('/api/suggestions/train')
        .send({ extractorId: factory.id('super_powers_extractor').toString() })
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
