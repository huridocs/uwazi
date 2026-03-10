import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { templateContext } from './fixtures.js';

describe('migration update translations of settings new Users/Groups UI', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(138);
  });

  it('should update the keys that have changed', async () => {
    await migration.up(testingDB.mongodb);
    const allTranslations = await testingDB.mongodb.collection('translations').find().toArray();

    const uwaziUI = allTranslations.filter(tr =>
      tr.contexts.filter(ctx => ctx.type === 'Uwazi UI')
    );

    const previousSystemValues = {
      key: 'existing-key-in-system',
      value: 'existing-key-in-system',
    };

    const addedKeys = [
      expect.objectContaining({
        key: 'New user',
        value: 'New user',
      }),
      expect.objectContaining({
        key: 'Instructions to reset the password were sent to the user',
        value: 'Instructions to reset the password were sent to the user',
      }),
    ];
    const defaultContextContent = expect.objectContaining({
      type: 'Uwazi UI',
      values: expect.arrayContaining([previousSystemValues, ...addedKeys]),
    });
    expect(uwaziUI).toMatchObject([
      expect.objectContaining({
        locale: 'en',
        contexts: [defaultContextContent, templateContext],
      }),
      expect.objectContaining({
        locale: 'es',
        contexts: [
          expect.objectContaining({
            type: 'Uwazi UI',
            values: expect.arrayContaining([previousSystemValues, ...addedKeys]),
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
