import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { PostgresUsersDAO } from '../PostgresUsersDAO.js';
import { PostgresUserGroupsDAO } from '../PostgresUserGroupsDAO.js';
import { PostgresUsersQueryService } from '../PostgresUsersQueryService.js';

const TENANT_ID = 'test-tenant';

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const getQueryService = (tenantId = TENANT_ID) => {
  const deps = { tenantId, pgTransactionManager: managerFor(tenantId) };
  const usersDAO = new PostgresUsersDAO(deps);
  const userGroupsDAO = new PostgresUserGroupsDAO({ ...deps, usersDAO });
  return new PostgresUsersQueryService({ usersDAO, userGroupsDAO });
};

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingPG.clear(['users', 'usergroups']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

const setupFixtures = async () => {
  const publicUserId = PUBLIC_USER_ID.toHexString();

  await testingPG.setFixtures({
    users: [
      {
        _id: 'active1',
        tenant_id: TENANT_ID,
        username: 'active1',
        role: 'admin',
        email: 'active1@test.com',
        password: 'hash',
        using2fa: false,
      },
      {
        _id: 'active2',
        tenant_id: TENANT_ID,
        username: 'active2',
        role: 'editor',
        email: 'active2@test.com',
        password: 'hash',
        using2fa: false,
      },
      {
        _id: 'deleted',
        tenant_id: TENANT_ID,
        username: 'deleted',
        role: 'editor',
        email: 'deleted@test.com',
        password: 'hash',
        using2fa: false,
        deletedAt: new Date(),
      },
      {
        _id: publicUserId,
        tenant_id: TENANT_ID,
        username: 'public',
        role: 'collaborator',
        email: 'public@uwazi.local',
        password: 'hash',
        using2fa: false,
      },
      {
        _id: 'withsensitive',
        tenant_id: TENANT_ID,
        username: 'withsensitive',
        role: 'admin',
        email: 'sensitive@test.com',
        password: 'hash',
        secret: 'mysecret',
        failedLogins: 3,
        accountUnlockCode: 'abc123',
        accountLocked: false,
        using2fa: true,
      },
    ],
    usergroups: [
      { _id: 'group-a', tenant_id: TENANT_ID, name: 'Group A', members: ['active1'] },
      {
        _id: 'group-b',
        tenant_id: TENANT_ID,
        name: 'Group B',
        members: ['active1', 'active2'],
      },
    ],
  });
};

describe('PostgresUsersQueryService', () => {
  describe('listWithGroups()', () => {
    it('should return active users with public fields only', async () => {
      await setupFixtures();
      const queryService = getQueryService();
      const users = await queryService.listWithGroups();

      expect(users.length).toBe(3);

      users.forEach(user => {
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('_id');
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('secret');
        expect(user).not.toHaveProperty('failedLogins');
        expect(user).not.toHaveProperty('accountUnlockCode');
      });
    });

    it('should exclude deleted users', async () => {
      await setupFixtures();
      const queryService = getQueryService();
      const users = await queryService.listWithGroups();

      const deletedUser = users.find(u => u.username === 'deleted');
      expect(deletedUser).toBeUndefined();
    });

    it('should exclude the system user', async () => {
      await setupFixtures();
      const queryService = getQueryService();
      const users = await queryService.listWithGroups();

      const publicUser = users.find(u => u.username === 'public');
      expect(publicUser).toBeUndefined();
    });

    it('should return users with groups', async () => {
      await setupFixtures();
      const queryService = getQueryService();
      const users = await queryService.listWithGroups();

      const active1 = users.find(user => user.username === 'active1');
      expect(active1).toBeDefined();
      expect(active1!.groups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Group A' }),
          expect.objectContaining({ name: 'Group B' }),
        ])
      );

      const active2 = users.find(user => user.username === 'active2');
      expect(active2).toBeDefined();
      expect(active2!.groups).toEqual([expect.objectContaining({ name: 'Group B' })]);
    });

    it('should filter by query', async () => {
      await setupFixtures();
      const queryService = getQueryService();
      let users = await queryService.listWithGroups({ username: 'active2' });

      expect(users.length).toBe(1);
      expect(users[0].email).toBe('active2@test.com');

      users = await queryService.listWithGroups({ email: 'sensitive@test.com' });

      expect(users.length).toBe(1);
      expect(users[0].username).toBe('withsensitive');
    });

    it('should return empty array when query matches nothing', async () => {
      await setupFixtures();
      const queryService = getQueryService();
      const users = await queryService.listWithGroups({ username: 'nonexistent' });

      expect(users).toEqual([]);
    });
  });

  describe('listBasicInfo()', () => {
    it('should return all non-deleted, non-public users with minimal shape', async () => {
      await setupFixtures();
      const queryService = getQueryService();
      const users = await queryService.listBasicInfo();

      expect(users.map(u => u.username).sort()).toEqual(['active1', 'active2', 'withsensitive']);
    });
  });

  describe('findByEmailOrUsername()', () => {
    it('should match by exact username, case-insensitively', async () => {
      await setupFixtures();
      const queryService = getQueryService();
      const users = await queryService.findByEmailOrUsername('ACTIVE1');

      expect(users.map(u => u.username)).toEqual(['active1']);
    });

    it('should match by exact email, case-insensitively', async () => {
      await setupFixtures();
      const queryService = getQueryService();
      const users = await queryService.findByEmailOrUsername('ACTIVE2@TEST.COM');

      expect(users.map(u => u.username)).toEqual(['active2']);
    });

    it('should not match a partial/prefix term', async () => {
      await setupFixtures();
      const queryService = getQueryService();
      const users = await queryService.findByEmailOrUsername('active');

      expect(users).toEqual([]);
    });

    it('should exclude soft-deleted users', async () => {
      await setupFixtures();
      const queryService = getQueryService();
      const users = await queryService.findByEmailOrUsername('deleted');

      expect(users).toEqual([]);
    });

    it('should exclude the public/system user', async () => {
      await setupFixtures();
      const queryService = getQueryService();
      const users = await queryService.findByEmailOrUsername('public');

      expect(users).toEqual([]);
    });

    it('should return an empty array when nothing matches', async () => {
      await setupFixtures();
      const queryService = getQueryService();
      expect(await queryService.findByEmailOrUsername('nonexistent')).toEqual([]);
    });
  });
});
