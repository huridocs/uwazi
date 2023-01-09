import testingDB from 'api/utils/testing_db';

import fixtures from './fixtures.js';
import migration from '../index.js';

describe('migration entities_override_mongo_language', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(1);
  });

  it('should migrate properly', async () => {
    await migration.up(testingDB.mongodb);

    const entities = await testingDB.mongodb.collection('entities').find().toArray();

    expect(entities.find(e => e.language === 'en').mongoLanguage).toBe('en');
    expect(entities.find(e1 => e1.language === 'es').mongoLanguage).toBe('es');
    expect(entities.find(e2 => e2.language === 'pt').mongoLanguage).toBe('pt');
    expect(entities.find(e3 => e3.language === 'ar').mongoLanguage).toBe('none');
  });
});
