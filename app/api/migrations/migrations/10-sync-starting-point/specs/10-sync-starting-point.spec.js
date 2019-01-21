import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, {
  template1,
  template2,
  entity1,
  entity3,
  translation1,
  connection1,
  migration1
} from './fixtures.js';

describe('migration sync-starting-point', () => {
  let updatelogs;

  const expectLog = id => ({ toHave: (value) => {
    const log = updatelogs.find(l => l.mongoId.toString() === id.toString());
    expect(log).toEqual(expect.objectContaining(Object.assign({ timestamp: 1, deleted: false }, value)));
  } });

  beforeEach((done) => {
    testingDB.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(10);
  });

  it('should generate update logs of all the required collections, clearing previous logs', async () => {
    await migration.up(testingDB.mongodb);

    updatelogs = await testingDB.mongodb.collection('updatelogs').find().toArray();

    expect(updatelogs.length).toBe(10);
    expectLog(template1).toHave({ namespace: 'templates' });
    expectLog(template2).toHave({ namespace: 'templates' });
    expectLog(entity1).toHave({ namespace: 'entities' });
    expectLog(entity3).toHave({ namespace: 'entities' });
    expectLog(translation1).toHave({ namespace: 'translations' });
    expectLog(connection1).toHave({ namespace: 'connections' });

    expect(updatelogs.find(l => l.mongoId.toString() === migration1.toString())).not.toBeDefined();
  });
});
