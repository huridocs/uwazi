import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration denormalize-inherited', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(38);
  });

  it('should fail', async () => {
    await migration.up(testingDB.mongodb);
    const [denormalizedEntity] = await testingDB.mongodb
      .collection('entities')
      .find({ title: 'test_doc' })
      .toArray();

    expect(denormalizedEntity.metadata.friend).toEqual([
      {
        inheritedType: 'text',
        inheritedValue: [{ value: 'Bocata Tun' }],
        label: 'test_doc 2',
        value: '456DEF',
      },
    ]);
  });
});
