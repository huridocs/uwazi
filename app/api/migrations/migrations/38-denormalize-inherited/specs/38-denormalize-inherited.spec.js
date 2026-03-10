import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration denormalize-inherited', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(38);
  });

  it('should denormalize inherited data', async () => {
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
      {
        inheritedType: 'text',
        inheritedValue: [],
        label: 'test_doc 3',
        value: '789ZXY',
      },
    ]);

    const [denormalizedEntityWithoutValues] = await testingDB.mongodb
      .collection('entities')
      .find({ title: 'test_doc 4' })
      .toArray();

    expect(denormalizedEntityWithoutValues.metadata.friend).toEqual([
      {
        inheritedType: 'text',
        inheritedValue: [],
        label: 'test_doc 5',
        value: '789ABC',
      },
      {
        inheritedType: 'text',
        inheritedValue: [],
        label: 'There is only zull',
        value: 'zull',
      },
    ]);
  });
});
