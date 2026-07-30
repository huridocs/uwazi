import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoUsersDAO } from '../MongoUsersDAO.js';
import { MongoUsersQueryService } from '../MongoUsersQueryService.js';
import { fixtures } from './fixtures.js';

const getQueryService = () =>
  testingEnvironment.runWithContext(() => {
    const db = getConnection();
    const transactionManager = TransactionManagerFactory.default();
    const dao = new MongoUsersDAO({ db, transactionManager });
    return new MongoUsersQueryService({ db, transactionManager, dao });
  });

describe('MongoUsersQueryService', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('listWithGroups()', () => {
    it('should return active users with public fields only', async () => {
      const queryService = getQueryService();
      const users = await queryService.listWithGroups();

      expect(users.length).toBe(3);

      users.forEach(user => {
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('_id');
        expect(user.password).toBeUndefined();
        expect(user.secret).toBeUndefined();
        expect(user.failedLogins).toBeUndefined();
        expect(user.accountUnlockCode).toBeUndefined();
      });
    });

    it('should exclude deleted users', async () => {
      const queryService = getQueryService();
      const users = await queryService.listWithGroups();

      const deletedUser = users.find(u => u.username === 'deleted');
      expect(deletedUser).toBeUndefined();
    });

    it('should exclude the system user', async () => {
      const queryService = getQueryService();
      const users = await queryService.listWithGroups();

      const publicUser = users.find(u => u.username === 'public');
      expect(publicUser).toBeUndefined();
    });

    it('should return users with groups', async () => {
      const queryService = getQueryService();
      const users = await queryService.listWithGroups();

      const active1 = users.find(user => user.username === 'active1');
      expect(active1).toBeDefined();
      expect(active1!.groups).toEqual([
        expect.objectContaining({ name: 'Group A' }),
        expect.objectContaining({ name: 'Group B' }),
      ]);

      const active2 = users.find(user => user.username === 'active2');
      expect(active2).toBeDefined();
      expect(active2!.groups).toEqual([expect.objectContaining({ name: 'Group B' })]);
    });

    it('should filter by query', async () => {
      const queryService = getQueryService();
      let users = await queryService.listWithGroups({ username: 'active2' });

      expect(users.length).toBe(1);
      expect(users[0].email).toBe('active2@test.com');

      users = await queryService.listWithGroups({ email: 'sensitive@test.com' });

      expect(users.length).toBe(1);
      expect(users[0].username).toBe('withsensitive');
    });

    it('should return empty array when query matches nothing', async () => {
      const queryService = getQueryService();
      const users = await queryService.listWithGroups({ username: 'nonexistent' });

      expect(users).toEqual([]);
    });
  });
});
