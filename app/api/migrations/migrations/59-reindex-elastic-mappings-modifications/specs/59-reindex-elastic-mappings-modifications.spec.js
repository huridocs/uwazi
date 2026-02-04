import migration from '../index.js';

describe('migration reindex-elastic-mappings-modifications', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(59);
  });

  it('should check if a reindex is needed', async () => {
    await migration.up();

    expect(migration.reindex).toBe(true);
  });
});
