import migration from '../index.js';

describe('migration Remove raw field from elastic', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(73);
  });

  it('should fail', async () => {
    await migration.up();
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(true);
  });
});
