import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, {
  template1,
  template2,
  entity1,
  entity3,
  translation1,
  connection1,
  migration1,
} from './fixtures.js';

describe('migration sync-starting-point', () => {
  let updatelogs;

  const expectLog = id => ({
    toBelongTo: namespace => {
      const log = updatelogs.find(l => l.mongoId.toString() === id.toString());
      const expectedOrder = {
        settings: 1,
        dictionaries: 2,
        relationtypes: 2,
        translations: 2,
        templates: 3,
        entities: 4,
        connections: 5,
      };
      expect(log).toEqual(
        expect.objectContaining({ namespace, timestamp: expectedOrder[namespace], deleted: false })
      );
    },
  });

  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(10);
  });

  it('should generate update logs of all the required collections, clearing previous logs', async () => {
    await migration.up(testingDB.mongodb);

    updatelogs = await testingDB.mongodb.collection('updatelogs').find().toArray();

    expect(updatelogs.length).toBe(10);
    expectLog(template1).toBelongTo('templates');
    expectLog(template2).toBelongTo('templates');
    expectLog(entity1).toBelongTo('entities');
    expectLog(entity3).toBelongTo('entities');
    expectLog(translation1).toBelongTo('translations');
    expectLog(connection1).toBelongTo('connections');

    expect(updatelogs.find(l => l.mongoId.toString() === migration1.toString())).not.toBeDefined();
  });
});
