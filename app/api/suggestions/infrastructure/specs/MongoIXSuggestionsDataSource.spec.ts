import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { IXSuggestionsDAOFactory } from '../IXSuggestionsDAOFactory.js';

const factory = getFixturesFactory();

const dao = () => IXSuggestionsDAOFactory.default();

const extractorId = factory.id('extractor');

const readSyncLogs = async () =>
  db.mongodb!.collection('updatelogs').find({ namespace: 'ixsuggestions' }).toArray();

const readRaw = async (id: any) => db.mongodb!.collection('ixsuggestions').findOne({ _id: id });

describe('MongoIXSuggestionsDataSource', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({
      ixsuggestions: [
        factory.ixSuggestion({
          _id: factory.id('accepted'),
          extractorId,
          entityId: 'entity1',
          language: 'en',
          status: 'ready',
          date: 1000,
          modelData: { suggestionsRunTimestamp: 500 } as any,
          state: { withSuggestion: true, withValue: true, obsolete: false, error: false },
        }),
        factory.ixSuggestion({
          _id: factory.id('blank'),
          extractorId,
          entityId: 'entity2',
          language: 'en',
          status: 'ready',
          date: 1000,
          modelData: { suggestionsRunTimestamp: 500 } as any,
          state: { withSuggestion: true, withValue: false, obsolete: false, error: false },
        }),
        factory.ixSuggestion({
          _id: factory.id('obsolete'),
          extractorId,
          entityId: 'entity3',
          language: 'en',
          status: 'ready',
          date: 900,
          state: { withSuggestion: true, withValue: false, obsolete: true, error: false },
        }),
        factory.ixSuggestion({
          _id: factory.id('pending'),
          extractorId,
          entityId: 'entity4',
          language: 'en',
          status: 'processing',
          date: null as any,
          state: { withSuggestion: false, withValue: false, obsolete: false, error: false },
        }),
      ],
    } as any);
  });

  afterAll(async () => testingEnvironment.tearDown());

  /**
   * The odm model this data source replaces wraps every write in `UpdateLogHelper`, which is what
   * instance-to-instance sync consumes. `MongoDataSource`'s `SyncedCollection` is the equivalent,
   * but nothing else asserts it for this collection — and if it silently stopped, sync would
   * break with every other test still green.
   */
  describe('sync logging', () => {
    it('should record a sync log on insert', async () => {
      await dao().createMultiple([
        { extractorId, entityId: 'new', language: 'en', propertyName: 'p' } as any,
      ]);

      const logged = await readSyncLogs();
      expect(logged).toHaveLength(1);
      expect(logged[0]).toMatchObject({ namespace: 'ixsuggestions', deleted: false });
    });

    it('should record a sync log on update', async () => {
      // Fixtures are inserted straight into mongo, so nothing is logged yet.
      expect(await readSyncLogs()).toEqual([]);

      await dao().markObsoleteForExtractor(extractorId);

      expect((await readSyncLogs()).length).toBeGreaterThan(0);
    });

    it('should record a sync log on delete', async () => {
      expect(await readSyncLogs()).toEqual([]);

      await dao().deleteByEntityId('entity1');

      const logged = await readSyncLogs();
      expect(
        logged.find(log => String(log.mongoId) === String(factory.id('accepted')))
      ).toMatchObject({ deleted: true });
    });
  });

  /**
   * Unlike the other two IX models, `IXSuggestionsModel` declares real schema properties with
   * defaults. A raw driver insert applies none of them, which would silently produce documents
   * of a different shape than every row already in the collection.
   */
  describe('insert defaults', () => {
    it('should apply the schema defaults the mongoose model applied', async () => {
      await dao().createMultiple([{ extractorId, entityId: 'defaulted' } as any]);

      const created = await db.mongodb!.collection('ixsuggestions').findOne({
        entityId: 'defaulted',
      });
      expect(created).toMatchObject({ status: 'processing', useForTraining: false });
    });

    it('should not override values the caller provided', async () => {
      await dao().createMultiple([
        { extractorId, entityId: 'explicit', status: 'ready', useForTraining: true } as any,
      ]);

      const created = await db.mongodb!.collection('ixsuggestions').findOne({
        entityId: 'explicit',
      });
      expect(created).toMatchObject({ status: 'ready', useForTraining: true });
    });
  });

  describe('saveMultiple', () => {
    it('should merge into existing rows rather than replace them', async () => {
      await dao().saveMultiple([{ _id: factory.id('accepted'), suggestedValue: 'changed' }]);

      const saved = await readRaw(factory.id('accepted'));
      expect(saved).toMatchObject({
        suggestedValue: 'changed',
        entityId: 'entity1',
        propertyName: 'propertyName',
      });
    });

    it('should insert rows that have no id yet, and return everything saved', async () => {
      const saved = await dao().saveMultiple([
        { _id: factory.id('accepted'), suggestedValue: 'changed' },
        { extractorId, entityId: 'brand-new', language: 'en' },
      ]);

      expect(saved).toHaveLength(2);
      expect(saved.map(s => s.entityId).sort()).toEqual(['brand-new', 'entity1']);
      expect(saved.find(s => s.entityId === 'brand-new')).toMatchObject({ status: 'processing' });
    });
  });

  describe('getByIds', () => {
    it('should ignore ids that cannot be object ids rather than throwing', async () => {
      // The accept endpoint passes whatever the request body carried. The mongoose model this
      // replaced turned an unparseable id into a catchable cast error; `new ObjectId('any')`
      // throws a BSON error the user sees as an empty message.
      const found = await dao().getByIds(['any', factory.id('accepted')]);

      expect(found.map(s => s.entityId)).toEqual(['entity1']);
    });
  });

  describe('acceptance', () => {
    const query = (overrides = {}) => ({
      extractorId,
      scope: { kind: 'all' } as const,
      includeAlreadyValued: false,
      ...overrides,
    });

    it('should exclude suggestions whose entity already has a value unless overwriting', async () => {
      expect((await dao().getAcceptable(query(), { limit: 10 })).map(s => s.entityId)).toEqual([
        'entity2',
      ]);

      const overwriting = await dao().getAcceptable(query({ includeAlreadyValued: true }), {
        limit: 10,
      });
      expect(overwriting.map(s => s.entityId).sort()).toEqual(['entity1', 'entity2']);
    });

    it('should exclude obsolete, errored and non-ready suggestions', async () => {
      const all = await dao().getAcceptable(query({ includeAlreadyValued: true }), { limit: 10 });

      expect(all.map(s => s.entityId)).not.toContain('entity3');
      expect(all.map(s => s.entityId)).not.toContain('entity4');
    });

    it('should scope to a cohort of entities', async () => {
      const scoped = query({
        includeAlreadyValued: true,
        scope: { kind: 'entities', entityIds: ['entity1'] },
      });

      expect((await dao().getAcceptable(scoped, { limit: 10 })).map(s => s.entityId)).toEqual([
        'entity1',
      ]);
      expect(await dao().countAcceptable(scoped)).toBe(1);
    });

    it('should accept nothing when the cohort is empty', async () => {
      const empty = query({ scope: { kind: 'entities', entityIds: [] } });

      expect(await dao().countAcceptable(empty)).toBe(0);
    });

    it('should scope to a run timestamp', async () => {
      const run = query({ includeAlreadyValued: true, scope: { kind: 'run', runTimestamp: 500 } });

      expect(await dao().countAcceptable(run)).toBe(2);
      expect(
        await dao().countAcceptable(query({ scope: { kind: 'run', runTimestamp: 999 } }))
      ).toBe(0);
    });
  });

  describe('counts', () => {
    it('should count every suggestion of the extractor', async () => {
      expect(await dao().countAllForExtractor(extractorId)).toBe(4);
    });

    it('should default to all three pending statuses', async () => {
      // entity4 is non-processed, entity3 is obsolete
      expect(await dao().countPendingForExtractor(extractorId)).toBe(2);
    });

    it('should honour a status filter', async () => {
      expect(await dao().countPendingForExtractor(extractorId, { obsolete: true })).toBe(1);
      expect(await dao().countPendingForExtractor(extractorId, { nonProcessed: true })).toBe(1);
      expect(await dao().countPendingForExtractor(extractorId, { error: true })).toBe(0);
    });

    it('should count what a run completed', async () => {
      expect(await dao().countProcessedInRun(extractorId, 500)).toBe(2);
      expect(await dao().countProcessedInRun(extractorId, 501)).toBe(0);
    });

    it('should count what was processed since a point in time', async () => {
      expect(await dao().countProcessedSince(extractorId, 950)).toBe(2);
    });
  });

  describe('entity id sets', () => {
    it('should report entities already queued or answered in this run', async () => {
      const seen = await dao().getEntityIdsSeenInRun(
        extractorId,
        ['entity1', 'entity3', 'entity4'],
        500
      );

      // entity1 answered in run 500, entity4 currently processing, entity3 neither
      expect(seen.sort()).toEqual(['entity1', 'entity4']);
    });

    it('should separate healthy from obsolete entities', async () => {
      const ids = ['entity1', 'entity2', 'entity3', 'entity4'];

      expect((await dao().getEntityIdsWithHealthySuggestions(extractorId, ids)).sort()).toEqual([
        'entity1',
        'entity2',
      ]);
      expect(await dao().getEntityIdsWithObsoleteSuggestions(extractorId, ids)).toEqual([
        'entity3',
      ]);
    });
  });

  describe('deletes', () => {
    it('should delete by template within the given extractors only', async () => {
      const template = (await readRaw(factory.id('accepted')))!.entityTemplate;

      await dao().deleteByTemplatesAndExtractors([template], [factory.id('other-extractor')]);
      expect(await readRaw(factory.id('accepted'))).not.toBeNull();

      await dao().deleteByTemplatesAndExtractors([template], [extractorId]);
      expect(await readRaw(factory.id('accepted'))).toBeNull();
    });
  });
});
