import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration page-languages', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(8);
  });

  it('should remove duplicated relationships, sharedIds and languages', async () => {
    await migration.up(testingDB.mongodb);
    const pages = await testingDB.mongodb.collection('pages').find().toArray();
    expect(pages.length).toBe(4);
    const pagesInES = pages.filter(p => p.language === 'es');
    const pagesInPT = pages.filter(p => p.language === 'pt');
    expect(pagesInES.length).toBe(2);
    expect(pagesInPT.length).toBe(2);
  });
});
