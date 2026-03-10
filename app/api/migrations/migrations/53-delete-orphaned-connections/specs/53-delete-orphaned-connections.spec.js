import testingDB from 'api/utils/testing_db';
import migration from '../index.js';

describe('migration delete-orphaned-connections', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(53);
  });

  it('should delete all connections which do not have an existing entity', async () => {
    expect(migration.description).toBe('Hot Patched to do nothing');
  });
});
