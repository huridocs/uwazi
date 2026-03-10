import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration replace_connection_with_relationship_type', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(110);
  });

  it('should replace  `connection` for `relationship type` while keeping other contexts', async () => {
    await migration.up(testingDB.mongodb);

    const allTranslations = await testingDB.mongodb.collection('translations').find().toArray();

    const relationShipContexts = allTranslations.map(t => ({
      locale: t.locale,
      contexts: t.contexts
        .filter(context => context.type === 'Relationship Type')
        .map(context => context.label),
    }));

    const otherContexts = allTranslations.map(t => ({
      locale: t.locale,
      contexts: t.contexts
        .filter(context => context.type !== 'Relationship Type')
        .map(context => context.label),
    }));

    expect(relationShipContexts).toEqual([
      { locale: 'en', contexts: ['Related', 'Inherited'] },
      { locale: 'es', contexts: ['Related', 'Inherited'] },
    ]);
    expect(otherContexts).toEqual([
      { locale: 'en', contexts: ['User Interface'] },
      { locale: 'es', contexts: ['User Interface'] },
    ]);
  });
});
