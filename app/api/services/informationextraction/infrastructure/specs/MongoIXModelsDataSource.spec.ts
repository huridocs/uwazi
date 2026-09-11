import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { IXModelsDAOFactory } from '../IXModelsDAOFactory.js';

const factory = getFixturesFactory();

const dao = () => IXModelsDAOFactory.default();

const readSyncLogs = async () =>
  db.mongodb!.collection('updatelogs').find({ namespace: 'ixmodels' }).toArray();

const readRawModel = async () =>
  db.mongodb!.collection('ixmodels').findOne({ _id: factory.id('model') as any });

describe('MongoIXModelsDataSource', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({
      ixmodels: [
        {
          ...factory.ixModel('model', 'extractor'),
          findingSuggestions: true,
          maxSuggestionsToFind: 10,
          processRun: {
            mode: 'process_selected',
            samplePolicy: 'only_marked',
            suggestionsRunTimestamp: 1000,
            findSuggestionsSharedIds: ['a', 'b', 'c'],
            findSuggestionsInitialSharedIdsCount: 3,
          },
        },
      ],
    } as any);
  });

  afterAll(async () => testingEnvironment.tearDown());

  /**
   * The odm model this data source replaced wrapped every write in `UpdateLogHelper`, which is
   * what instance-to-instance sync consumes. `MongoDataSource`'s `SyncedCollection` is the
   * equivalent, but nothing else asserts it for this collection — and if it silently stopped,
   * sync would break with every other test still green.
   */
  describe('sync logging', () => {
    it('should record a sync log when a model is created', async () => {
      const created = await dao().save({ extractorId: factory.id('other'), creationDate: 1 });

      const logged = await readSyncLogs();
      expect(logged.find(log => String(log.mongoId) === String(created._id))).toMatchObject({
        namespace: 'ixmodels',
        deleted: false,
      });
    });

    it('should record a sync log when a model is updated', async () => {
      // Fixtures are inserted straight into mongo, so nothing is logged yet. Without this the
      // assertion below could pass simply because an unrelated log already existed.
      expect(await readSyncLogs()).toEqual([]);

      await dao().markReady(factory.id('extractor'));

      const logged = await readSyncLogs();
      expect(logged.find(log => String(log.mongoId) === String(factory.id('model')))).toMatchObject(
        { namespace: 'ixmodels', deleted: false }
      );
    });
  });

  describe('save', () => {
    it('should merge into the existing row rather than replace it', async () => {
      await dao().save({ _id: factory.id('model'), totalSuggestionsToFind: 7 });

      const saved = await dao().getByExtractorId(factory.id('extractor'));
      expect(saved).toMatchObject({
        totalSuggestionsToFind: 7,
        maxSuggestionsToFind: 10,
        processRun: { mode: 'process_selected' },
      });
    });

    it('should create a row when none exists for that id', async () => {
      const created = await dao().save({ extractorId: factory.id('fresh'), creationDate: 5 });

      expect(created._id).toBeDefined();
      expect(await dao().getByExtractorId(factory.id('fresh'))).toMatchObject({ creationDate: 5 });
    });
  });

  describe('markReady', () => {
    it('should flip the status and drop the run queue in one write, keeping the rest of processRun', async () => {
      const updated = await dao().markReady(factory.id('extractor'));

      expect(updated).toMatchObject({ status: 'ready', findingSuggestions: false });
      expect(updated!.processRun).toEqual({
        mode: 'process_selected',
        samplePolicy: 'only_marked',
      });
    });

    it('should return undefined when the extractor has no model', async () => {
      expect(await dao().markReady(factory.id('unknown'))).toBeUndefined();
    });
  });

  describe('takeFromFindRunQueue', () => {
    it('should return the head of the queue and leave the tail behind', async () => {
      expect(await dao().takeFromFindRunQueue(factory.id('model'), 2)).toEqual(['a', 'b']);

      const model = await dao().getByExtractorId(factory.id('extractor'));
      expect(model!.processRun!.findSuggestionsSharedIds).toEqual(['c']);
    });

    it('should empty the queue when the batch is larger than what is left', async () => {
      expect(await dao().takeFromFindRunQueue(factory.id('model'), 10)).toEqual(['a', 'b', 'c']);

      const model = await dao().getByExtractorId(factory.id('extractor'));
      expect(model!.processRun!.findSuggestionsSharedIds).toEqual([]);
    });

    it('should return nothing when the queue is already empty', async () => {
      await dao().takeFromFindRunQueue(factory.id('model'), 10);

      expect(await dao().takeFromFindRunQueue(factory.id('model'), 5)).toEqual([]);
    });

    it('should not lose ids when two takes race', async () => {
      const [first, second] = await Promise.all([
        dao().takeFromFindRunQueue(factory.id('model'), 2),
        dao().takeFromFindRunQueue(factory.id('model'), 2),
      ]);

      expect([...first, ...second].sort()).toEqual(['a', 'b', 'c']);
    });
  });

  describe('appendToFindRunQueue', () => {
    it('should union new ids in and grow the initial count by only the new ones', async () => {
      await dao().appendToFindRunQueue(factory.id('model'), ['c', 'd']);

      const model = await dao().getByExtractorId(factory.id('extractor'));
      expect(model!.processRun!.findSuggestionsSharedIds!.sort()).toEqual(['a', 'b', 'c', 'd']);
      expect(model!.processRun!.findSuggestionsInitialSharedIdsCount).toBe(4);
      expect(model!.findingSuggestions).toBe(true);
    });
  });

  describe('markTraining', () => {
    it('should discard the whole previous process run', async () => {
      await dao().markTraining(factory.id('extractor'), { maxSuggestionsToFind: 25 });

      const model = await dao().getByExtractorId(factory.id('extractor'));
      expect(model).toMatchObject({
        status: 'processing',
        findingSuggestions: true,
        maxSuggestionsToFind: 25,
      });
      expect(model!.processRun).toBeUndefined();
    });

    it('should create the model row when the extractor has never been trained', async () => {
      await dao().markTraining(factory.id('untrained'), { maxSuggestionsToFind: 5 });

      expect(await dao().getByExtractorId(factory.id('untrained'))).toMatchObject({
        maxSuggestionsToFind: 5,
      });
    });
  });

  describe('setSamplePolicy', () => {
    it('should set the policy without disturbing the rest of the run', async () => {
      await dao().setSamplePolicy(factory.id('extractor'), 'marked_plus_labeled');

      const model = await readRawModel();
      expect(model!.processRun).toMatchObject({
        samplePolicy: 'marked_plus_labeled',
        mode: 'process_selected',
      });
    });
  });
});
