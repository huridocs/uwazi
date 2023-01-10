import { testingDB } from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures, templateId, defaultTemplateName, defaultTemplateTitle } from './fixtures.js';

const locales = ['en', 'es', 'hu'];
const newKeyValues = [
  {
    key: 'Confirm delete',
    value: 'Confirm delete',
  },
  {
    key: 'Are you sure you want to delete this attachment?',
    value: 'Are you sure you want to delete this attachment?',
  },
  {
    key: 'Confirm delete file',
    value: 'Confirm delete file',
  },
  {
    key: 'Are you sure you want to delete this file?',
    value: 'Are you sure you want to delete this file?',
  },
  {
    key: 'Are you sure you want to delete this item?',
    value: 'Are you sure you want to delete this item?',
  },
  {
    key: 'Are you sure you want to delete this entity?',
    value: 'Are you sure you want to delete this entity?',
  },
  {
    key: 'Confirm delete connection',
    value: 'Confirm delete connection',
  },
  {
    key: 'Are you sure you want to delete this connection?',
    value: 'Are you sure you want to delete this connection?',
  },
  {
    key: 'Confirm edit suggestion-enabled Thesaurus',
    value: 'Confirm edit suggestion-enabled Thesaurus',
  },
  {
    key: 'Are you sure you want to delete this page?',
    value: 'Are you sure you want to delete this page?',
  },
  {
    key: 'Confirm delete entity',
    value: 'Confirm delete entity',
  },
  {
    key: 'Keep this in mind if you want to edit:',
    value: 'Keep this in mind if you want to edit:',
  },
  {
    key: 'Confirm discard changes',
    value: 'Confirm discard changes',
  },
  {
    key: 'Confirm delete of template:',
    value: 'Confirm delete of template:',
  },
  {
    key: 'Can not delete template:',
    value: 'Can not delete template:',
  },
  {
    key: 'This template has associated entities',
    value: 'This template has associated entities',
  },
  {
    key: 'Confirm delete connection type:',
    value: 'Confirm delete connection type:',
  },
  {
    key: 'Cannot delete connection type:',
    value: 'Cannot delete connection type:',
  },
  {
    key: 'This connection type is being used and cannot be deleted.',
    value: 'This connection type is being used and cannot be deleted.',
  },
  {
    key: 'Confirm delete thesaurus:',
    value: 'Confirm delete thesaurus:',
  },
  {
    key: 'Are you sure you want to delete this thesaurus?',
    value: 'Are you sure you want to delete this thesaurus?',
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
    expect(migration.delta).toBe(77);
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
