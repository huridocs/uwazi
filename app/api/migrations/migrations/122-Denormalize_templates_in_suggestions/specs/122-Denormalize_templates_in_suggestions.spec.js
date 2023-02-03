import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('migration Denormalize templates in suggestions', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(122);
  });

  it('should denormalize the template of the entity into the suggestion record', async () => {
    await migration.up(testingDB.mongodb);

    const suggestions = await testingDB.mongodb.collection('ixsuggestions').find({}).toArray();

    suggestions.forEach(suggestion => {
      expect(suggestion.entityTemplate).toEqual(
        fixtures.entities
          .find(entity => entity.sharedId === suggestion.entityId)
          .template.toString()
      );
    });
  });
});
