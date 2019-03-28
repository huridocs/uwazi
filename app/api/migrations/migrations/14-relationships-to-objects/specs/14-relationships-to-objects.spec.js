import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration relationships-to-objects', () => {
  beforeEach((done) => {
    spyOn(process.stdout, 'write');
    testingDB.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(14);
  });

  it('should transform relationship properties to objects', async () => {
    await migration.up(testingDB.mongodb);
    const entitiesMigrated = await testingDB.mongodb.collection('entities').find().toArray();
    const entityWithProp = entitiesMigrated.find(e => e.title === 'migrated');
    expect(entityWithProp.metadata.pais_relationship).toEqual([{ entity: '1' }, { entity: '2' }]);

    const templatesMigrated = await testingDB.mongodb.collection('templates').find().toArray();
    expect(templatesMigrated[0].properties[0].name).toEqual('text_text');
    expect(templatesMigrated[0].properties[1].name).toEqual('pais_relationship');
  });
});
