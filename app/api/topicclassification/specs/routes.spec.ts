import * as topicClassification from 'api/config/topicClassification';
import { setUpApp } from 'api/utils/testingRoutes';
import db from 'api/utils/testing_db';
import { NextFunction } from 'express';
import JSONRequest from 'shared/JSONRequest';
import request from 'supertest';

import testRoute from '../routes';
import fixtures, { moviesId } from './fixtures';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

async function fakeGet(url: string, _data: any, _headers: any) {
  if (url === `${topicClassification.tcServer}/models/list?filter=undefined-topmovies`) {
    return {
      status: 200,
      headers: new Headers(),
      cookie: 'cookie',
      json: {
        models: ['undefined-topmovies'],
        error: '',
      },
      endpoint: { url, method: 'GET' },
    };
  }
  if (url === `${topicClassification.tcServer}/models?model=undefined-topmovies`) {
    return {
      status: 200,
      headers: new Headers(),
      cookie: 'cookie',
      json: {
        preferred: '123',
      },
      endpoint: { url, method: 'GET' },
    };
  }
  if (url === `${topicClassification.tcServer}/task?name=train-undefined-topmovies`) {
    return {
      status: 200,
      headers: new Headers(),
      cookie: 'cookie',
      json: {
        state: 'done',
        status: 'done training',
      },
      endpoint: { url, method: 'GET' },
    };
  }
  return {
    status: 404,
    headers: new Headers(),
    cookie: 'cookie',
    json: {
      state: 'not found',
      status: 'not found',
    },
    endpoint: { url, method: 'GET' },
  };
}

async function fakePost(url: string, data: any, _headers: any) {
  if (url === `${topicClassification.tcServer}/task`) {
    expect(data).toEqual({
      provider: 'TrainModel',
      name: 'train-undefined-topmovies',
      model: 'undefined-topmovies',
      labels: ['groundhog day', 'terminator 2', 'batman', 'spiderman', 'single value'],
      samples: [{ seq: 'title2 why? because I am Batman.', training_labels: ['batman'] }],
      num_train_steps: 3000,
      train_ratio: 0.5,
    });
    return {
      status: 200,
      headers: new Headers(),
      cookie: 'cookie',
      json: {
        state: 'running',
        status: 'started training',
      },
      endpoint: { url, method: 'GET' },
    };
  }
  return {
    status: 404,
    headers: new Headers(),
    cookie: 'cookie',
    json: {
      state: 'not found',
      status: 'not found',
    },
    endpoint: { url, method: 'GET' },
  };
}

describe('topic classification routes', () => {
  const app = setUpApp(testRoute);

  beforeEach(async () => {
    const elasticIndex = 'tc_routes_test';
    await db.setupFixturesAndContext(fixtures, elasticIndex);
    jest.spyOn(JSONRequest, 'post').mockImplementation(fakePost);
    jest.spyOn(JSONRequest, 'get').mockImplementation(fakeGet);
    jest
      .spyOn(topicClassification, 'IsTopicClassificationReachable')
      .mockReturnValue(Promise.resolve(true));
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('GET', () => {
    describe('when passing a thesaurus name as a filter', () => {
      it('should get a single, relevant model', async () => {
        const response = await request(app).get('/api/models').query({ thesaurus: 'Top movies' });
        expect(response.body).toEqual({ name: 'Top movies', preferred: '123' });
      });
    });
    describe('train', () => {
      it('should start training and get progress', async () => {
        const response = await request(app)
          .post('/api/models/train')
          .send({ thesaurusId: moviesId });

        expect(response.body).toEqual(
          expect.objectContaining({ state: 'running', message: 'started training' })
        );

        const status = await request(app)
          .get('/api/models/train')
          .query({ thesaurus: 'Top movies' });

        expect(status.body).toEqual(
          expect.objectContaining({ state: 'done', message: 'done training' })
        );
      });
    });
  });
});
