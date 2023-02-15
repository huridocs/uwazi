import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures, templateId, defaultTemplateName, defaultTemplateTitle } from './fixtures.js';

describe('migration remove-obsolete-translation-keys', () => {
  const locales = ['en', 'es', 'hu'];

  const newKeyValues = [
    {
      key: 'Available default translation',
      value: 'Available default translation',
    },
    {
      key: 'Translations reset successfully',
      value: 'Translations reset successfully',
    },
    {
      key: 'Confirm reset translation',
      value: 'Confirm reset translation',
    },
    {
      key: 'Are you sure you want to reset translation for',
      value: 'Are you sure you want to reset translation for',
    },
  ];

  const obsoleteTranslationKeys = [
    'Default language',
    'Default language description',
    'Some adavanced search features may not be available for this language.',
  ];

  const alreadyInAllContexts = {
    key: 'Duplicated label',
    en: 'Duplicated label',
    es: 'Nombre duplicado',
    hu: 'Ismétlődő címke',
  };
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    migration.reindex = false;
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(103);
  });

  it('should append new keys, leave existing keys intact.', async () => {
    await testingDB.setupFixturesAndContext(fixtures);
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

    obsoleteTranslationKeys.forEach(key => {
      locales.forEach(loc => {
        expect(
          allTranslations
            .find(tr => tr.locale === loc)
            .contexts.find(c => c.id === 'System')
            .values.find(v => v.key === key)
        ).toBeUndefined();
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
