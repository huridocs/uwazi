import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { templateContext } from './fixtures.js';

describe('remove old system translation migration', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(123);
  });

  it('should remove the keys that have been deleted', async () => {
    await migration.up(testingDB.mongodb);
    const allTranslations = await testingDB.mongodb.collection('translations').find().toArray();

    const uwaziUI = allTranslations.reduce((accum, tr) => {
      const systemContext = tr.contexts.find(ctx => ctx.type === 'Uwazi UI');
      return [...accum, systemContext];
    }, []);

    const updatedContexts = allTranslations.filter(tr =>
      tr.contexts.filter(ctx => ctx.type === 'Uwazi UI')
    );

    const deletedKeys = [
      'Browse your PDFs to upload',
      'For better performance, upload your files in batches of 50 or less.',
    ];

    const keyInDB = uwaziUI.reduce(
      (accum, context) =>
        accum || context.values.filter(value => deletedKeys.includes(value.key)).length > 0,
      false
    );

    expect(keyInDB).toBe(false);

    const previousSystemValues = {
      key: 'existing-key-in-system',
      value: 'existing-key-in-system',
    };

    const defaultContextContent = expect.objectContaining({
      type: 'Uwazi UI',
      values: expect.arrayContaining([previousSystemValues]),
    });
    expect(updatedContexts).toMatchObject([
      expect.objectContaining({
        locale: 'en',
        contexts: [defaultContextContent, templateContext],
      }),
      expect.objectContaining({
        locale: 'es',
        contexts: [
          expect.objectContaining({
            type: 'Uwazi UI',
            values: expect.arrayContaining([previousSystemValues]),
          }),
          templateContext,
        ],
      }),
      expect.objectContaining({
        locale: 'pt',
        contexts: [defaultContextContent, templateContext],
      }),
    ]);
  });
});
