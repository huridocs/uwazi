import * as topicClassification from 'api/config/topicClassification';
import 'api/utils/jasmineHelpers';
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

function fakeGet(url: string, _data: any, _headers: any) {
  if (url === `${topicClassification.tcServer}/models/list?filter=undefined-topmovies`) {
    return {
      status: 200,
      json: {
        models: ['undefined-topmovies'],
        error: '',
      },
    };
  }
  if (url === `${topicClassification.tcServer}/models?model=undefined-topmovies`) {
    return {
      status: 200,
      json: {
        preferred: '123',
      },
    };
  }
  if (url === `${topicClassification.tcServer}/task?name=train-undefined-topmovies`) {
    return {
      status: 200,
      json: {
        state: 'done',
        status: 'done training',
      },
    };
  }
  return { status: 404 };
}

function fakePost(url: string, data: any, _headers: any) {
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
      json: {
        state: 'running',
        status: 'started training',
      },
    };
  }
  return { status: 404 };
}

describe('topic classification routes', () => {
  const app = setUpApp(testRoute);

  beforeEach(async () => {
    const elasticIndex = 'tc_routes_test';
    await db.setupFixturesAndContext(fixtures, elasticIndex);
    spyOn(JSONRequest, 'post').and.callFake(fakePost);
    spyOn(JSONRequest, 'get').and.callFake(fakeGet);
    spyOn(topicClassification, 'IsTopicClassificationReachable').and.returnValue(true);
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
