import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { IXExtractorsDAOFactory } from '../IXExtractorsDAOFactory.js';

const factory = getFixturesFactory();

const readSyncLogs = async () =>
  db.mongodb!.collection('updatelogs').find({ namespace: 'ixextractors' }).toArray();

describe('MongoIXExtractorsDataSource', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({
      templates: [factory.template('tpl', [factory.property('prop', 'text')])],
      ixextractors: [factory.ixExtractor('existing', 'prop', ['tpl'], { property: 'prop' })],
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
    it('should record a sync log when an extractor is created', async () => {
      const created = await IXExtractorsDAOFactory.default().create({
        name: 'created',
        property: 'prop',
        templates: [factory.idString('tpl')],
        source: { property: 'prop' },
      } as any);

      const logged = await readSyncLogs();
      expect(logged.map(log => String(log.mongoId))).toContain(String(created._id));
      expect(logged.find(log => String(log.mongoId) === String(created._id))).toMatchObject({
        namespace: 'ixextractors',
        deleted: false,
      });
    });

    it('should record a sync log when an extractor is deleted', async () => {
      const id = factory.id('existing');
      // Fixtures are inserted straight into mongo, so nothing is logged yet. Without this the
      // assertion below could pass simply because no log ever existed to contradict it.
      expect(await readSyncLogs()).toEqual([]);

      await IXExtractorsDAOFactory.default().deleteByIds([id]);

      const logged = await readSyncLogs();
      expect(logged.find(log => String(log.mongoId) === String(id))).toMatchObject({
        deleted: true,
      });
    });
  });
});
