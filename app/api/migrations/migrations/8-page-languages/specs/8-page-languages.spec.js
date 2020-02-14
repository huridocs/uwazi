import { catchErrors } from 'api/utils/jasmineHelpers';
import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration page-languages', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    testingDB
      .clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(8);
  });

  it('should remove duplicated relationships, sharedIds and languages', async () => {
    await migration.up(testingDB.mongodb);
    const pages = await testingDB.mongodb
      .collection('pages')
      .find()
      .toArray();
    expect(pages.length).toBe(4);
    const pagesInES = pages.filter(p => p.language === 'es');
    const pagesInPT = pages.filter(p => p.language === 'pt');
    expect(pagesInES.length).toBe(2);
    expect(pagesInPT.length).toBe(2);
  });
});
