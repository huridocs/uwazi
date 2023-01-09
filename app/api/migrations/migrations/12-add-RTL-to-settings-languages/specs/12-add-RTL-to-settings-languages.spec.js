import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration add-RTL-to-settings-languages', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(12);
  });

  it('should add RTL to settings languages', async () => {
    await migration.up(testingDB.mongodb);
    const [{ languages }] = await testingDB.mongodb.collection('settings').find({}).toArray();

    const rtlLanguages = languages.filter(l => l.rtl);

    expect(languages.length).toBe(24);
    expect(rtlLanguages.length).toBe(10);

    rtlLanguages.forEach(language => {
      expect(migration.rtlLanguagesList).toContain(language.key);
    });
  });

  it('should not affect other settings', async () => {
    await migration.up(testingDB.mongodb);
    const settingsCollection = await testingDB.mongodb.collection('settings').find({}).toArray();
    expect(settingsCollection.length).toBe(1);

    const [{ otherProperty }] = settingsCollection;
    expect(otherProperty).toBe('test');
  });
});
