import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration inherit-conflict', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(46);
  });

  it('should disable inherit for any conflicting property', async () => {
    await migration.up(testingDB.mongodb);

    const [judge] = await testingDB.mongodb
      .collection('templates')
      .find({ name: 'judge' })
      .toArray();

    expect(judge.properties[1].name).toBe('country');
    expect(judge.properties[1].inherit).not.toBeDefined();

    const [victim] = await testingDB.mongodb
      .collection('templates')
      .find({ name: 'victim' })
      .toArray();

    expect(victim.properties[1].name).toBe('country');
    expect(victim.properties[1].inherit).not.toBeDefined();

    const [document] = await testingDB.mongodb
      .collection('templates')
      .find({ name: 'document' })
      .toArray();

    expect(document.properties[1].name).toBe('country_code');
    expect(document.properties[1].inherit).toBeDefined();
  });
});
