import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('migration fix_template_translations', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(80);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });

  it('should sync current template name to translation key and value', async () => {
    await migration.up(testingDB.mongodb);
    const [enTranslations] = await testingDB.mongodb
      .collection('translations')
      .find({ locale: 'en' })
      .toArray();

    const [esTranslations] = await testingDB.mongodb
      .collection('translations')
      .find({ locale: 'es' })
      .toArray();

    expect(enTranslations).toMatchObject({
      locale: 'en',
      contexts: [
        {
          label: 'new template name',
          values: [
            { key: 'text', value: 'text' },
            { key: 'new template name', value: 'translation template name' },
          ],
          type: 'Entity',
        },
        {
          label: 'new template name 2',
          values: [{ key: 'new template name 2', value: 'translation template name 2' }],
          type: 'Entity',
        },
      ],
    });

    expect(esTranslations).toMatchObject({
      locale: 'es',
      contexts: [
        {
          label: 'new template name',
          values: [
            { key: 'text', value: 'text' },
            { key: 'new template name', value: 'traduccion template name' },
          ],
          type: 'Entity',
        },
        {
          label: 'new template name 2',
          values: [{ key: 'new template name 2', value: 'traduccion template name 2' }],
          type: 'Entity',
        },
      ],
    });
  });
});
