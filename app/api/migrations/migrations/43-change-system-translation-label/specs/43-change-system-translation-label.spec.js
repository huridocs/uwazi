import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration change-system-translation-label', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(43);
  });

  it('should update system labels to User Interface', async () => {
    const expectedLabel = 'User Interface';
    await migration.up(testingDB.mongodb);
    const [en, es, pt] = await testingDB.mongodb
      .collection('translations')
      .find({})
      .toArray();

    expect(en.contexts[0].label).toEqual(expectedLabel);
    expect(es.contexts[0].label).toEqual(expectedLabel);
    expect(pt.contexts[0].label).toEqual(expectedLabel);
  });

  it('should not update contexts without system id', async () => {
    const context = {
      id: 'somecontext',
      label: 'System',
    };

    await testingDB.clearAllAndLoad({
      translations: [{ contexts: [{ ...context }] }],
    });

    await migration.up(testingDB.mongodb);

    const [translations] = await testingDB.mongodb
      .collection('translations')
      .find({})
      .toArray();

    expect(translations.contexts[0].label).toEqual('System');
  });
});
