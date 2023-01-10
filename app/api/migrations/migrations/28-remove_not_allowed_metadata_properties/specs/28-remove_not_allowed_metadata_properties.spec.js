import { testingDB } from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { template1, template2 } from './fixtures.js';

describe('migration remove_not_allowed_metadata_properties', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(28);
  });

  it('should remove metadata properties from entities that do not exist on the template they belong', async () => {
    await migration.up(testingDB.mongodb);

    const template1Entities = await testingDB.mongodb
      .collection('entities')
      .find({ template: template1 })
      .toArray();

    const template2Entities = await testingDB.mongodb
      .collection('entities')
      .find({ template: template2 })
      .toArray();

    const entitiesNoTemplate = await testingDB.mongodb
      .collection('entities')
      .find({ template: { $exists: false } })
      .toArray();

    expect(entitiesNoTemplate).toEqual([expect.objectContaining({ metadata: {} })]);

    expect(template1Entities).toEqual([
      expect.objectContaining({
        metadata: {
          text: [{ value: 'value' }],
          text_2: [{ value: 'value2' }],
        },
      }),
      expect.objectContaining({
        metadata: {
          text: [{ value: 'value' }],
          text_2: [{ value: 'value2' }],
        },
      }),
    ]);

    expect(template2Entities).toEqual([
      expect.objectContaining({
        metadata: {
          text_3: [{ value: 'value3' }],
        },
      }),
      expect.objectContaining({ title: 'entity without metadata' }),
    ]);
  });
});
