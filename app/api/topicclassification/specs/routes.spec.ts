import * as topicClassification from 'api/config/topicClassification';
import searchLib, { instanceSearch } from 'api/search/search';
import instanceElasticTesting from 'api/utils/elastic_testing';
import instrumentRoutes from 'api/utils/instrumentRoutes.js';
import 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import JSONRequest from 'shared/JSONRequest';
import topicClassificationRoute from '../routes';
import fixtures, { moviesId } from './fixtures';

function fakeGet(url: string, data: any, _headers: any) {
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
  let routes: { get: any; post: any };
  const elasticIndex = 'search_index_test';
  const search = instanceSearch(elasticIndex);
  const elasticTesting = instanceElasticTesting(elasticIndex, search);

  beforeEach(async () => {
    routes = instrumentRoutes(topicClassificationRoute);
    await db.clearAllAndLoad(fixtures);
    await elasticTesting.reindex();
    // spyOn(searchLib, 'indexEntities').and.callFake(search.indexEntities);
    spyOn(searchLib, 'search').and.callFake(search.search);
    spyOn(JSONRequest, 'post').and.callFake(fakePost);
    spyOn(JSONRequest, 'get').and.callFake(fakeGet);
    spyOn(topicClassification, 'IsTopicClassificationReachable').and.returnValue(true);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('GET', () => {
    it('should need authorization', () => {
      const req = { query: { thesaurus: 'Top movies' } };
      expect(routes.get('/api/models', req)).toNeedAuthorization();
    });

    describe('when passing a thesaurus name as a filter', () => {
      it('should get a single, relevant model', async () => {
        const req = { query: { thesaurus: 'Top movies' } };

        const response = await routes.get('/api/models', req);
        expect(response).toEqual({ name: 'Top movies', preferred: '123' });
      });
    });
    describe('train', () => {
      it('should start training and get progress', async () => {
        const req = { body: { thesaurusId: moviesId } };

        const response = await routes.post('/api/models/train', req);
        expect(response).toEqual(
          expect.objectContaining({ state: 'running', message: 'started training' })
        );

        const status = await routes.get('/api/models/train', {
          query: { thesaurus: 'Top movies' },
        });
        expect(status).toEqual(
          expect.objectContaining({ state: 'done', message: 'done training' })
        );
      });
    });
  });
});
