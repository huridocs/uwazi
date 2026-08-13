import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoUsersDAO } from '../MongoUsersDAO.js';
import { MongoUsersQueryService } from '../MongoUsersQueryService.js';
import { fixtures } from './fixtures.js';

const getQueryService = () =>
  testingEnvironment.runWithContext(() => {
    const dao = new MongoUsersDAO({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.default(),
    });
    return new MongoUsersQueryService({ dao });
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

  describe('listBasicInfo()', () => {
    it('should return all non-deleted, non-public users with minimal shape', async () => {
      const queryService = getQueryService();
      const users = await queryService.listBasicInfo();

      expect(users.map(u => u.username).sort()).toEqual(['active1', 'active2', 'withsensitive']);
    });
  });

  describe('findByEmailOrUsername()', () => {
    it('should match by exact username, case-insensitively', async () => {
      const queryService = getQueryService();
      const users = await queryService.findByEmailOrUsername('ACTIVE1');

      expect(users.map(u => u.username)).toEqual(['active1']);
    });

    it('should match by exact email, case-insensitively', async () => {
      const queryService = getQueryService();
      const users = await queryService.findByEmailOrUsername('ACTIVE2@TEST.COM');

      expect(users.map(u => u.username)).toEqual(['active2']);
    });

    it('should not match a partial/prefix term', async () => {
      const queryService = getQueryService();
      const users = await queryService.findByEmailOrUsername('active');

      expect(users).toEqual([]);
    });

    it('should exclude soft-deleted users', async () => {
      const queryService = getQueryService();
      const users = await queryService.findByEmailOrUsername('deleted');

      expect(users).toEqual([]);
    });

    it('should exclude the public/system user', async () => {
      const queryService = getQueryService();
      const users = await queryService.findByEmailOrUsername('public');

      expect(users).toEqual([]);
    });

    it('should return an empty array when nothing matches', async () => {
      const queryService = getQueryService();
      expect(await queryService.findByEmailOrUsername('nonexistent')).toEqual([]);
    });
  });
});
