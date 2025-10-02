/* eslint-disable max-statements */
import request from 'supertest';
import { Application, NextFunction, Request, Response } from 'express';

import entities from 'api/entities';
import { search } from 'api/search';
import {
  factory,
  fixtures,
  shared6enId,
  stateFilterFixtures,
  suggestionSharedId6Title,
} from 'api/suggestions/specs/fixtures';
import { suggestionsRoutes } from 'api/suggestions/routes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { iosocket, setUpApp, TestEmitSources } from 'api/utils/testingRoutes';
import waitForExpect from 'wait-for-expect';
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

    testModel = jest.fn().mockResolvedValue({ status: 'processing' });
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
      .send({ extractorId: factory.id('super_powers_extractor').toString() });
    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ status: 'processing' });
  });

  it('should accept suggestionsToFind', async () => {
    const response = await request(app)
      .post('/api/suggestions/train')
      .send({ extractorId: factory.id('super_powers_extractor').toString(), suggestionsToFind: 1 });
    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ status: 'processing' });
  });

  it('should accept options.samplePolicy', async () => {
    const response = await request(app)
      .post('/api/suggestions/train')
      .send({
        extractorId: factory.id('super_powers_extractor').toString(),
        options: { samplePolicy: 'only_marked' },
      });
    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ status: 'processing' });
  });
});

describe('POST /api/suggestions/accept', () => {
  const suggestionsSuccess = async () =>
    waitForExpect(() => {
      expect(iosocket.emit).toHaveBeenCalledWith(
        'ACCEPT_SUGGESTION_SUCCESS',
        TestEmitSources.session
      );
      expect(iosocket.emit).toHaveBeenCalledTimes(1);
    });

  afterEach(() => {
    iosocket.emit.mockClear();
  });

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
      .expect(202);

    await suggestionsSuccess();

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
      .expect(202);

    await suggestionsSuccess();

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

  it('should emit ACCEPT_SUGGESTION_SUCCESS event after accept suggestion finish with success', async () => {
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
      .expect(202);

    await suggestionsSuccess();
  });

  it('should emit ACCEPT_SUGGESTION_ERROR event after accept suggestion finish with error', async () => {
    await request(app)
      .post('/api/suggestions/accept')
      .send({
        suggestions: [
          {
            _id: 'any',
            sharedId: 'any',
            entityId: 'any',
          },
        ],
      })
      .expect(202);

    await waitForExpect(() => {
      expect(iosocket.emit).toHaveBeenCalledWith(
        'ACCEPT_SUGGESTION_ERROR',
        TestEmitSources.session,
        expect.any(String)
      );

      expect(iosocket.emit).toHaveBeenCalledTimes(1);
    });
  });
});

describe('aggregation routes', () => {
  describe('GET /api/suggestions/aggregation', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp(stateFilterFixtures);
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
        total: 18,
        labeled: 8,
        nonLabeled: 10,
        match: 4,
        mismatch: 10,
        obsolete: 2,
        error: 2,
        noContext: 12,
        nonProcessed: 0,
        useForTraining: 2,
        accuracy: 50,
      });
    });
  });
});
