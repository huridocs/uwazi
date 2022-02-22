import { testingDB } from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('migration remove_id_and_localID_from_template', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(63);
  });

  it('should remove localID and id from template properties', async () => {
    await migration.up(testingDB.mongodb);

    const templates = await testingDB.mongodb.collection('templates').find().toArray();

    templates.forEach(template => {
      template.properties.forEach(property => {
        expect(property.id).toBe(undefined);
        expect(property.localID).toBe(undefined);
      });
    });
  });
});
