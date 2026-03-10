import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { templateId, defaultTemplateName, defaultTemplateTitle } from './fixtures.js';

const locales = ['en', 'es', 'hu'];
const newKeyValues = [
  { key: 'Default template', value: 'Default template' },
  { key: 'Zoom in', value: 'Zoom in' },
  {
    key: 'landing page description',
    value: `The landing page is the first thing users will see when visiting your Uwazi instance.
You can use any URL from your Uwazi instance as a landing page, examples:
A page: /page/dicxg0oagy3xgr7ixef80k9
Library results: /library/?searchTerm=test
An entity: /entity/9htbkgpkyy7j5rk9
A document: /document/4y9i99fadjp833di
Always use URLs relative to your site, starting with / and skipping the https://yoursite.com/.`,
  },
];
const alreadyInAllContexts = {
  key: 'Upload PDF',
  en: 'Upload PDF',
  es: 'Subir PDF',
  hu: 'PDF Feltöltése',
};
const alreadyInOneContext = [
  { locale: 'hu', key: 'Year', value: 'Year', existingValue: 'Év' },
  {
    locale: 'es',
    key: 'Two-step verification',
    value: 'Two-step verification',
    existingValue: 'Verificación en dos pasos',
  },
];

describe('migration add_system_key_translations', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(49);
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
    locales.forEach(loc =>
      testKeyValue(alreadyInAllContexts.key, alreadyInAllContexts[loc], loc, 'System')
    );
    alreadyInOneContext.forEach(({ locale, key, value, existingValue }) => {
      locales.forEach(loc =>
        testKeyValue(key, locale === loc ? existingValue : value, loc, 'System')
      );
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
