import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration replace_dictionary_with_thesaurus', () => {
  let translations;
  let contexts = [];

  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
    await migration.up(testingDB.mongodb);
    translations = await testingDB.mongodb.collection('translations').find({}).toArray();
    translations.forEach(translation => {
      contexts = contexts.concat(translation.contexts);
    });
  });

  afterEach(() => {
    contexts = [];
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(55);
  });

  it('should update the correct translations', async () => {
    expect(contexts.filter(context => context.type === 'Thesaurus').length).toEqual(2);
  });
  it('should not update the translations that have no Dictionary context', async () => {
    expect(contexts.filter(context => context.type !== 'Thesaurus').length).toEqual(2);
  });
});
