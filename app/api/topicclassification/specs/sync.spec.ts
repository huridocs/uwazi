import * as topicClassification from 'api/config/topicClassification';
import entities from 'api/entities';
import { search } from 'api/search';
import db from 'api/utils/testing_db';
import JSONRequest from 'shared/JSONRequest';
import { provenanceTypes } from 'shared/provenanceTypes';
import { TaskProvider } from 'shared/tasks/tasks';
import { SyncArgs, syncEntity } from '../sync';
import fixtures, { e1, e3 } from './fixtures';

async function fakeTopicClassification(url: string) {
  if (url === `${topicClassification.tcServer}/models/list?filter=%5Eundefined`) {
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
  if (url === `${topicClassification.tcServer}/classify?model=undefined-topmovies`) {
    return {
      status: 200,
      headers: new Headers(),
      cookie: 'cookie',
      json: {
        samples: [
          {
            sharedId: 'e1',
            predicted_labels: [
              { topic: '1.1', quality: 0.4 },
              { topic: '2.2', quality: 0.7 },
            ],
            model_version: '123',
          },
          {
            sharedId: 'e3',
            predicted_labels: [
              { topic: '1.1', quality: 0.4 },
              { topic: '2.2', quality: 0.7 },
            ],
            model_version: '123',
          },
        ],
      },
      endpoint: { url, method: 'GET' },
    };
  }
  return {
    status: 404,
    headers: new Headers(),
    cookie: 'cookie',
    json: {},
    endpoint: { url, method: 'GET' },
  };
}

describe('templates utils', () => {
  beforeEach(async () => {
    await db.setupFixturesAndContext(fixtures);
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    jest.spyOn(JSONRequest, 'post').mockImplementation(fakeTopicClassification);
    jest.spyOn(JSONRequest, 'get').mockImplementation(fakeTopicClassification);
    jest
      .spyOn(topicClassification, 'IsTopicClassificationReachable')
      .mockReturnValue(Promise.resolve(true));
  });
  afterAll(async () => {
    await db.disconnect();
  });

  describe('sync one', () => {
    it('add suggestions to single entity', async () => {
      const e = await entities.getById(e1);
      expect(await syncEntity(e!, { mode: 'onlynew', overwrite: false })).toBe(true);
      expect(e!.suggestedMetadata!.movies).toEqual([
        expect.objectContaining({
          label: 'spiderman',
          suggestion_confidence: 0.7,
          suggestion_model: '123',
          value: '2.2',
        }),
        expect.objectContaining({
          label: 'groundhog day',
          suggestion_confidence: 0.4,
          suggestion_model: '123',
          value: '1.1',
        }),
      ]);
      // Reject one, test that override keeps it.
      e!.suggestedMetadata!.movies = [e!.suggestedMetadata!.movies![0]];
      expect(
        await syncEntity(e!, { mode: 'onlynew', overwrite: true }, undefined, undefined, {
          'undefined-topmovies': '123',
        })
      ).toBe(false);
      expect(e!.suggestedMetadata!.movies).toEqual([
        expect.objectContaining({
          label: 'spiderman',
          suggestion_confidence: 0.7,
          suggestion_model: '123',
          value: '2.2',
        }),
      ]);
    });
  });

  describe('sync all', () => {
    it('run sync task', async () => {
      const t = TaskProvider.getOrCreate('test', 'TopicClassificationSync');
      t.start({ batchSize: 1, noDryRun: true, mode: 'onlynew', overwrite: true } as SyncArgs);
      await t.wait();
      expect(t.status).toMatchObject({
        result: { index: 2, seen: 3, total: 3 },
        state: 'done',
      });

      const e = await entities.getById(e1);
      expect(e!.suggestedMetadata!.movies).toMatchObject([
        {
          label: 'spiderman',
          suggestion_confidence: 0.7,
          suggestion_model: '123',
          value: '2.2',
        },
        {
          label: 'groundhog day',
          suggestion_confidence: 0.4,
          suggestion_model: '123',
          value: '1.1',
        },
      ]);

      const entity3 = await entities.getById(e3);
      expect(entity3!.suggestedMetadata!.movies).toMatchObject([
        {
          label: 'spiderman',
          suggestion_confidence: 0.7,
          suggestion_model: '123',
          value: '2.2',
        },
        {
          label: 'groundhog day',
          suggestion_confidence: 0.4,
          suggestion_model: '123',
          value: '1.1',
        },
      ]);
    });
  });

  describe('autoaccept one', () => {
    it('add labels to single entity', async () => {
      const e = await entities.getById(e1);
      expect(await syncEntity(e!, { mode: 'autoaccept', overwrite: false })).toBe(true);
      expect(e!.metadata!.movies).toEqual([
        expect.objectContaining({
          label: 'spiderman',
          suggestion_confidence: 0.7,
          suggestion_model: '123',
          value: '2.2',
          provenance: provenanceTypes.bulk,
        }),
        expect.objectContaining({
          label: 'groundhog day',
          suggestion_confidence: 0.4,
          suggestion_model: '123',
          value: '1.1',
          provenance: provenanceTypes.bulk,
        }),
      ]);
      // Remove one, test that override keeps it.
      e!.metadata!.movies = [e!.metadata!.movies![0]];
      expect(
        await syncEntity(e!, { mode: 'autoaccept', overwrite: true }, undefined, undefined, {
          'undefined-topmovies': '123',
        })
      ).toBe(false);
      expect(e!.metadata!.movies).toEqual([
        {
          label: 'spiderman',
          suggestion_confidence: 0.7,
          suggestion_model: '123',
          value: '2.2',
          provenance: provenanceTypes.bulk,
        },
      ]);
      // Change provenance, test that override keeps it.
      e!.metadata!.movies = [
        {
          label: 'spiderman',
          value: '2.2',
        },
      ];
      expect(await syncEntity(e!, { mode: 'autoaccept', overwrite: true })).toBe(false);
      expect(e!.metadata!.movies).toEqual([
        {
          label: 'spiderman',
          value: '2.2',
        },
      ]);
    });
  });
  describe('autoaccept all', () => {
    it('run sync task', async () => {
      const t = TaskProvider.getOrCreate('test', 'TopicClassificationSync');
      t.start({
        noDryRun: true,
        mode: 'autoaccept',
        overwrite: true,
        autoAcceptConfidence: 0.5,
      } as SyncArgs);
      await t.wait();
      expect(t.status).toMatchObject({
        result: { index: 2, seen: 3, total: 3 },
        state: 'done',
      });
      const e = await entities.getById(e1);
      expect(e!.metadata!.movies).toEqual([
        expect.objectContaining({
          label: 'spiderman',
          suggestion_confidence: 0.7,
          suggestion_model: '123',
          value: '2.2',
          provenance: provenanceTypes.bulk,
        }),
      ]);
    });
  });
});
