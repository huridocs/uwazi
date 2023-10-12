import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { translationsV2, translations, templateContext } from './fixtures.js';

describe('migration remove-obsolete-translation-keys', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext({ translationsV2, translations, templateContext });
    migration.reindex = false;
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(145);
  });

  it('should remove the obsoletes keys in all languages for V2 translations', async () => {
    await migration.up(testingDB.mongodb);
    const collectionV2 = await testingDB.mongodb.collection('translationsV2').find({}).toArray();

    expect(collectionV2).toMatchObject([
      {
        language: 'en',
        key: 'Library',
        value: 'Library',
        context: {
          type: 'Uwazi UI',
          label: 'User Interface',
          id: 'System',
        },
      },
      {
        language: 'es',
        key: 'Library',
        value: 'Biblioteca',
        context: {
          type: 'Uwazi UI',
          label: 'User Interface',
          id: 'System',
        },
      },
      {
        language: 'en',
        key: 'New password',
        value: 'New password',
        context: {
          type: 'Uwazi UI',
          label: 'User Interface',
          id: 'System',
        },
      },
      {
        language: 'es',
        key: 'New password',
        value: 'Nueva contraseña',
        context: {
          type: 'Uwazi UI',
          label: 'User Interface',
          id: 'System',
        },
      },
    ]);
  });

  it('should remove the keys that have been deleted in V1 translations', async () => {
    await migration.up(testingDB.mongodb);
    const allTranslations = await testingDB.mongodb.collection('translations').find().toArray();

    const uwaziUI = allTranslations.reduce((accum, tr) => {
      const systemContext = tr.contexts.find(ctx => ctx.type === 'Uwazi UI');
      return [...accum, systemContext];
    }, []);

    const updatedContexts = allTranslations.filter(tr =>
      tr.contexts.filter(ctx => ctx.type === 'Uwazi UI')
    );

    const deletedKeys = ['Confirm New Passowrd', 'New Password'];

    const keyInDB = uwaziUI.reduce(
      (accum, context) =>
        accum || context.values.filter(value => deletedKeys.includes(value.key)).length > 0,
      false
    );

    expect(keyInDB).toBe(false);

    const previousSystemValues = [
      {
        key: 'existing-key-in-system',
        value: 'existing-key-in-system',
      },
      {
        key: 'New password',
        value: 'New password',
      },
    ];

    const defaultContextContent = expect.objectContaining({
      type: 'Uwazi UI',
      values: expect.arrayContaining(previousSystemValues),
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
            values: expect.arrayContaining(previousSystemValues),
          }),
          templateContext,
        ],
      }),
    ]);
  });
});
