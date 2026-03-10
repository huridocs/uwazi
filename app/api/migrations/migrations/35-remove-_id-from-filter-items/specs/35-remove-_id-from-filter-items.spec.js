import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration remove-_id-from-filter-items', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(35);
  });

  it('should remove _id field from filter items', async () => {
    await migration.up(testingDB.mongodb);
    const settings = await testingDB.mongodb.collection('settings').find({}).toArray();

    const [item1, item2, item3] = settings[0].filters[0].items;
    expect(item1).not.toHaveProperty('_id');
    expect(item2).not.toHaveProperty('_id');
    expect(item3).not.toHaveProperty('_id');
  });

  it('should ignore items without _id property', async () => {
    const settings = [
      {
        filters: [
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
        ],
      },
    ];
    await testingDB.clearAllAndLoad({ settings });
    await migration.up(testingDB.mongodb);
    const savedSettings = await testingDB.mongodb.collection('settings').find({}).toArray();

    expect(savedSettings).toEqual(settings);
  });

  it('should ignore collections without filters', async () => {
    const settings = [
      {
        _id: 'someid',
        site_name: 'some name',
      },
    ];

    await testingDB.clearAllAndLoad({ settings });
    await migration.up(testingDB.mongodb);
    const savedSettings = await testingDB.mongodb.collection('settings').find({}).toArray();

    expect(savedSettings).toEqual(settings);
  });

  it('should ignore filters without items', async () => {
    const settings = [
      {
        filters: [
          {
            _id: 'somefilterid',
            id: 'someotherid',
            name: 'somename',
          },
        ],
      },
    ];

    await testingDB.clearAllAndLoad({ settings });
    await migration.up(testingDB.mongodb);
    const savedSettings = await testingDB.mongodb.collection('settings').find({}).toArray();

    expect(savedSettings).toEqual(settings);
  });

  it('should ignore filters with empty items', async () => {
    const settings = [
      {
        filters: [
          {
            id: 'someotherid',
            name: 'somename',
            items: [],
          },
          {
            id: 'someotherid',
            name: 'somename',
          },
        ],
      },
    ];
    await testingDB.clearAllAndLoad({ settings });
    await migration.up(testingDB.mongodb);
    const savedSettings = await testingDB.mongodb.collection('settings').find({}).toArray();

    expect(savedSettings).toEqual(settings);
  });
});
