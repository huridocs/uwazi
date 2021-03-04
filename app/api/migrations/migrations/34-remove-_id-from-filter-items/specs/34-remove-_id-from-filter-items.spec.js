import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration remove-_id-from-filter-items', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(34);
  });

  it('should remove _id field from filter items', async () => {
    await migration.up(testingDB.mongodb);
    const settings = await testingDB.mongodb
      .collection('settings')
      .find({})
      .toArray();

    const [item1, item2, item3] = settings[0].filters[0].items;
    expect(item1).not.toHaveProperty('_id');
    expect(item2).not.toHaveProperty('_id');
    expect(item3).not.toHaveProperty('_id');
  });

  it('should ignore items without _id property', async () => {
    const filters = [
      {
        items: [
          {
            id: 'someid',
          },
          {
            id: 'someotherid',
          },
        ],
      },
    ];
    await testingDB.clearAllAndLoad({ settings: [...filters] });
    await migration.up(testingDB.mongodb);
    const settings = await testingDB.mongodb
      .collection('settings')
      .find({})
      .toArray();

    expect(settings).toEqual(filters);
  });
});
