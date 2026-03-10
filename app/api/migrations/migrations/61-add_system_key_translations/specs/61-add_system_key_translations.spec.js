import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { templateId, defaultTemplateName, defaultTemplateTitle } from './fixtures.js';

const locales = ['en', 'es', 'hu'];
const newKeyValues = [
  {
    key: 'Suggestion',
    value: 'Suggestion',
  },
  {
    key: 'All',
    value: 'All',
  },
  {
    key: 'Filled',
    value: 'Filled',
  },
  {
    key: 'Empty',
    value: 'Empty',
  },
  {
    key: 'Segment',
    value: 'Segment',
  },
  {
    key: 'State',
    value: 'State',
  },
  {
    key: 'Reviewing',
    value: 'Reviewing',
  },
  {
    key: 'Dashboard',
    value: 'Dashboard',
  },
  {
    key: 'Find suggestions',
    value: 'Find suggestions',
  },
  {
    key: 'per page',
    value: 'per page',
  },
  {
    key: 'Review',
    value: 'Review',
  },
  {
    key: 'Confirm suggestion acceptance',
    value: 'Confirm suggestion acceptance',
  },
  {
    key: 'Apply to all languages',
    value: 'Apply to all languages',
  },
  {
    key: 'Matching',
    value: 'Matching',
  },
  {
    key: 'Pending',
    value: 'Pending',
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
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(61);
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
