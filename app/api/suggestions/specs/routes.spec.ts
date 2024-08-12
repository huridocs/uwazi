/* eslint-disable max-statements */
import request from 'supertest';
import { Application, NextFunction, Request, Response } from 'express';

import entities from 'api/entities';
import { search } from 'api/search';
import {
  factory,
  fixtures,
  shared2enId,
  shared2esId,
  shared6enId,
  stateFilterFixtures,
  suggestionSharedId6Title,
} from 'api/suggestions/specs/fixtures';
import { suggestionsRoutes } from 'api/suggestions/routes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
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

let user: { username: string; role: string } | undefined;
const getUser = () => user;

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

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('suggestions routes', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    await Suggestions.updateStates({});
  });

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
          entityId: shared2enId.toString(),
          sharedId: 'shared2',
          entityTitle: 'Batman en',
          propertyName: 'super_powers',
          suggestedValue: 'scientific knowledge',
          segment: 'he relies on his own scientific knowledge',
          state: {
            labeled: true,
            withValue: true,
            withSuggestion: true,
            match: true,
            hasContext: true,
            obsolete: false,
            processing: false,
            error: false,
          },
          language: 'en',
          page: 5,
        },
        {
          entityId: shared2esId.toString(),
          sharedId: 'shared2',
          entityTitle: 'Batman es',
          propertyName: 'super_powers',
          suggestedValue: 'scientific knowledge es',
          segment: 'el confía en su propio conocimiento científico',
          state: {
            labeled: true,
            withValue: true,
            withSuggestion: true,
            match: false,
            hasContext: true,
            obsolete: false,
            processing: false,
            error: false,
          },
          language: 'es',
          page: 5,
        },
        {
          entityId: factory.id('Alfred-english-entity').toString(),
          sharedId: 'shared3',
          entityTitle: 'Alfred',
          propertyName: 'super_powers',
          suggestedValue: 'puts up with Bruce Wayne',
          segment: 'he puts up with Bruce Wayne',
          state: {
            labeled: true,
            withValue: true,
            withSuggestion: true,
            match: false,
            hasContext: true,
            obsolete: false,
            processing: false,
            error: false,
          },
          language: 'en',
          page: 3,
        },
      ]);
      expect(response.body.totalPages).toBe(1);
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
      const joker = response.body.suggestions.find(
        (suggestion: any) => suggestion.entityTitle === 'Joker'
      );
      expect(joker).toMatchObject({
        entityTitle: 'Joker',
        propertyName: 'age',
        segment: 'Joker age is 45',
        sharedId: 'shared4',
        state: {
          error: true,
        },
        suggestedValue: null,
      });
      const alfred = response.body.suggestions.find(
        (suggestion: any) => suggestion.segment === 'Alfred 67 years old processing'
      );
      expect(alfred).toBeUndefined();
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
              customFilter: {
                labeled: {
                  match: false,
                  mismatch: false,
                },
                nonLabeled: {
                  withSuggestion: false,
                  noSuggestion: true,
                  noContext: false,
                  obsolete: false,
                  others: false,
                },
              },
            },
          })
          .expect(200);
        expect(response.body.suggestions).toEqual([
          expect.objectContaining({
            entityTitle: 'Catwoman',
            state: {
              labeled: false,
              withValue: false,
              withSuggestion: false,
              match: false,
              hasContext: true,
              obsolete: false,
              processing: false,
              error: false,
            },
            suggestedValue: '',
            currentValue: '',
          }),
        ]);
      });
    });

    describe('sorting', () => {
      it('should sort by entity title', async () => {
        const response = await request(app)
          .get('/api/suggestions')
          .query({
            filter: {
              extractorId: factory.id('super_powers_extractor').toString(),
            },
            sort: { property: 'entityTitle', order: 'desc' },
          })
          .expect(200);

        expect(response.body.suggestions[0]).toMatchObject({
          sharedId: 'shared2',
          entityTitle: 'Batman es',
          language: 'es',
        });

        expect(response.body.suggestions[1]).toMatchObject({
          sharedId: 'shared2',
          entityTitle: 'Batman en',
          language: 'en',
        });

        expect(response.body.suggestions[2]).toMatchObject({
          sharedId: 'shared3',
          entityTitle: 'Alfred',
          language: 'en',
        });

        expect(response.body.totalPages).toBe(1);
      });

      it('should sort by current value', async () => {
        const response = await request(app)
          .get('/api/suggestions')
          .query({
            filter: {
              extractorId: factory.id('super_powers_extractor').toString(),
            },
            sort: { property: 'currentValue' },
          })
          .expect(200);

        expect(response.body.suggestions[0]).toMatchObject({
          currentValue: 'conocimiento científico',
          entityTitle: 'Batman es',
          sharedId: 'shared2',
        });

        expect(response.body.suggestions[1]).toMatchObject({
          currentValue: 'no super powers',
          entityTitle: 'Alfred',
          sharedId: 'shared3',
        });

        expect(response.body.suggestions[2]).toMatchObject({
          currentValue: 'scientific knowledge',
          entityTitle: 'Batman en',
          sharedId: 'shared2',
        });

        expect(response.body.totalPages).toBe(1);
      });
    });

    describe('validation', () => {
      it('should return a validation error if params are not valid', async () => {
        const invalidQuery = { additionParam: true };
        const response = await request(app).get('/api/suggestions/').query(invalidQuery);
        expect(response.status).toBe(400);
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
  });

  describe('POST /api/suggestions/train', () => {
    it('should return the status of the IX process', async () => {
      const response = await request(app)
        .post('/api/suggestions/train')
        .send({ extractorId: factory.id('super_powers_extractor').toString() })
        .expect(200);

      expect(response.body).toMatchObject({ status: 'processing' });
    });
  });

  describe('POST /api/suggestions/accept', () => {
    it('should update the suggestion for title in one language', async () => {
      await request(app)
        .post('/api/suggestions/accept')
        .send({
          suggestions: [
            {
              _id: suggestionSharedId6Title,
              sharedId: 'shared6',
              entityId: shared6enId,
            },
          ],
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
      expect(search.indexEntities).toHaveBeenCalledWith({ sharedId: 'shared6' }, '+fullText');
    });

    it('should handle partial acceptance parameters for multiselects', async () => {
      await request(app)
        .post('/api/suggestions/accept')
        .send({
          suggestions: [
            {
              _id: factory.idString('multiSelectSuggestion2'),
              sharedId: 'entityWithSelects2',
              entityId: factory.idString('entityWithSelects2'),
              addedValues: ['1B'],
              removedValues: ['1A'],
            },
          ],
        })
        .expect(200);

      const [entity] = await entities.get({ sharedId: 'entityWithSelects2' });
      expect(entity.metadata.property_multiselect).toEqual([
        { value: 'A', label: 'A' },
        { value: '1B', label: '1B', parent: { value: '1', label: '1' } },
      ]);
      expect(search.indexEntities).toHaveBeenCalledWith(
        { sharedId: 'entityWithSelects2' },
        '+fullText'
      );
    });
  });
});

describe('aggregation routes', () => {
  describe('GET /api/suggestions/aggregation', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp(stateFilterFixtures);
      await Suggestions.updateStates({});
    });

    describe('validation', () => {
      it('should return a validation error if params are not valid', async () => {
        const invalidQuery = { additionParam: true };
        const response = await request(app).get('/api/suggestions/aggregation').query(invalidQuery);
        expect(response.status).toBe(400);

        const emptyQuery = {};
        const response2 = await request(app).get('/api/suggestions/aggregation').query(emptyQuery);
        expect(response2.status).toBe(400);
      });
    });

    it('should return the aggregation of suggestions', async () => {
      const response = await request(app)
        .get('/api/suggestions/aggregation')
        .query({
          extractorId: factory.id('test_extractor').toString(),
        })
        .expect(200);
      expect(response.body).toEqual({
        total: 12,
        labeled: {
          _count: 4,
          match: 2,
          mismatch: 2,
        },
        nonLabeled: {
          _count: 8,
          withSuggestion: 6,
          noSuggestion: 2,
          noContext: 4,
          obsolete: 2,
          others: 2,
        },
      });
    });
  });
});
