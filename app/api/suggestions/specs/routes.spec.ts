/* eslint-disable max-statements */
import request from 'supertest';
import { Application, NextFunction, Request, Response } from 'express';

import entities from 'api/entities';
import { search } from 'api/search';
import {
  factory,
  fixtures,
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

  afterAll(async () => {
    await testingEnvironment.tearDown();
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
      expect(search.indexEntities).toHaveBeenCalledWith(
        { _id: { $in: [shared6enId] } },
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
