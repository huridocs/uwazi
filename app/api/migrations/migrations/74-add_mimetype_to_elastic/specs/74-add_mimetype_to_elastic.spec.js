import migration from '#api/migrations/migrations/74-add_mimetype_to_elastic/index.js';

describe('migration add_mimetype_to_elastic', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(74);
  });

  it('should not fail', async () => {
    await migration.up();
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(true);
  });
});
