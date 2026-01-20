import testingDB from '#api/utils/testing_db.js';
import migration from '#api/migrations/migrations/9-default-template/index.js';
import fixtures from '#api/migrations/migrations/9-default-template/specs/fixtures.js';

describe('migration default-template', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(9);
  });

  it('should set a default template', async () => {
    await migration.up(testingDB.mongodb);
    const templates = await testingDB.mongodb.collection('templates').find().toArray();
    expect(templates[0].isEntity).not.toBeDefined();
    expect(templates[1].isEntity).not.toBeDefined();
    expect(templates[0].default).toBe(true);
  });
});
