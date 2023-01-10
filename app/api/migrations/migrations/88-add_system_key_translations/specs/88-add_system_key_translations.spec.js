import { testingDB } from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures, templateId, defaultTemplateName, defaultTemplateTitle } from './fixtures.js';

const locales = ['en', 'es', 'hu'];
const newKeyValues = [
  {
    key: 'Add PDF',
    value: 'Add PDF',
  },
];
const alreadyInAllContexts = {
  key: 'Duplicated label',
  en: 'Duplicated label',
  es: 'Nombre duplicado',
  hu: 'Ismétlődő címke',
};

describe('migration add_system_key_translations', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(88);
  });

  it('should append new keys, leave existing keys intact.', async () => {
    await migration.up(testingDB.mongodb);

    const allTranslations = await testingDB.mongodb.collection('translations').find().toArray();
    function testKeyValue(key, value, locale, contextId) {
      expect(
        allTranslations
          .find(tr => tr.locale === locale)
          .contexts.find(c => c.id === contextId)
          .values.find(v => v.key === key).value
      ).toBe(value);
    }

    newKeyValues.forEach(({ key, value }) => {
      locales.forEach(loc => {
        testKeyValue(key, value, loc, 'System');
      });
    });
    locales.forEach(loc => {
      testKeyValue(alreadyInAllContexts.key, alreadyInAllContexts[loc], loc, 'System');
    });
    locales.forEach(loc => {
      expect(
        allTranslations
          .find(tr => tr.locale === loc)
          .contexts.find(c => c.id === templateId.toString()).values
      ).toHaveLength(2);
      testKeyValue(defaultTemplateName, defaultTemplateName, loc, templateId.toString());
      testKeyValue(defaultTemplateTitle, defaultTemplateTitle, loc, templateId.toString());
    });
  });
});
