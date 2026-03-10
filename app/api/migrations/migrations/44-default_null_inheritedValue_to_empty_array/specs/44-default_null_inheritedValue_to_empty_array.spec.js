import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration default_null_inheritedValue_to_empty_array', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(44);
  });

  it('should default inheritedValue to [] when the value is null', async () => {
    await migration.up(testingDB.mongodb);
    const entities = await testingDB.mongodb.collection('entities').find({}).toArray();

    expect(entities[0].metadata.text).toEqual([{ value: 'text value' }]);

    expect(entities).toMatchObject([
      {
        metadata: {
          relationshipA: [
            { inheritedValue: [] },
            { inheritedValue: [{ value: 'value', label: 'label' }] },
          ],
        },
      },
      {
        metadata: {
          relationshipA: [{ inheritedValue: [] }, { inheritedValue: [] }],
        },
      },
      {
        metadata: {
          relationshipB: [
            { inheritedValue: [] },
            { inheritedValue: [{ value: 'value2', label: 'label2' }] },
            { inheritedValue: [] },
          ],
        },
      },
    ]);
  });
});
