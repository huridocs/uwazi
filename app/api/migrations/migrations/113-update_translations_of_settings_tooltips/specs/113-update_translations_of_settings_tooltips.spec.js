import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { templateContext } from './fixtures.js';

describe('migration update translations of settings tooltips', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(113);
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
        key: 'Click',
        value: 'Click',
      }),
      expect.objectContaining({
        key: 'here',
        value: 'here',
      }),
      expect.objectContaining({
        key: 'to learn how to add and configure a contact form on a webpage.',
        value: 'to learn how to add and configure a contact form on a webpage.',
      }),
    ];
    const defaultContextContent = expect.objectContaining({
      type: 'Uwazi UI',
      values: [
        previousSystemValues,
        expect.objectContaining({
          key: 'Landing page description',
          value: expect.stringContaining(
            'The landing page is the first page that visitors see when'
          ),
        }),
        ...addedKeys,
      ],
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
            values: [
              previousSystemValues,
              expect.objectContaining({
                key: 'Landing page description',
                value: expect.stringContaining('Configurar la pagina de inicio para tu sitio.'),
              }),
              ...addedKeys,
            ],
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
