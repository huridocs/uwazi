import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration change-system-translation-label', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(43);
  });

  it('should update system labels to User Interface', async () => {
    const expectedLabel = 'User Interface';
    await migration.up(testingDB.mongodb);
    const translations = await testingDB.mongodb.collection('translations').find({}).toArray();

    const localeFilter = locale => trans => trans.locale === locale;

    const en = translations.find(localeFilter('en'));
    const es = translations.find(localeFilter('es'));
    const pt = translations.find(localeFilter('pt'));

    expect(en.contexts[0].label).toEqual(expectedLabel);
    expect(es.contexts[0].label).toEqual(expectedLabel);
    expect(pt.contexts[0].label).toEqual(expectedLabel);
  });

  it('should not update contexts without system id', async () => {
    await migration.up(testingDB.mongodb);

    const [enTranslations] = await testingDB.mongodb
      .collection('translations')
      .find({ locale: 'en' })
      .toArray();

    expect(enTranslations.contexts[1].label).toEqual('Other');
  });
});
