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
   * Information extraction data is not synced between instances, so no IX write may leave an
   * `updatelogs` row behind.
   */
  describe('sync logging', () => {
    it('should not record sync logs on insert, update or delete', async () => {
      await dao().createMultiple([
        { extractorId, entityId: 'new', language: 'en', propertyName: 'p' } as any,
      ]);
      await dao().markObsoleteForExtractor(extractorId);
      await dao().deleteByEntityId('entity1');

      expect(await readSyncLogs()).toEqual([]);
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

  describe('setStates', () => {
    it('should overwrite the state of the given suggestions only', async () => {
      await dao().setStates([
        { id: factory.id('pending'), state: { labeled: true, match: true } as any },
      ]);

      expect((await readRaw(factory.id('pending')))?.state).toEqual({
        labeled: true,
        match: true,
      });
      expect((await readRaw(factory.id('accepted')))?.state).toMatchObject({
        withSuggestion: true,
      });
    });

    it('should not record sync logs for the suggestions it touches', async () => {
      await dao().setStates([
        { id: factory.id('pending'), state: { labeled: true } as any },
        { id: factory.id('accepted'), state: { labeled: false } as any },
      ]);

      expect(await readSyncLogs()).toEqual([]);
    });

    it('should do nothing when given no updates', async () => {
      await dao().setStates([]);

      expect((await readRaw(factory.id('pending')))?.state).toMatchObject({
        withSuggestion: false,
        obsolete: false,
      });
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
