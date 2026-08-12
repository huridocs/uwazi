import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { PostgresUsersDAO } from '../PostgresUsersDAO.js';

const TENANT_ID = 'test-tenant';

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const makeDAO = (tenantId = TENANT_ID) =>
  new PostgresUsersDAO({ tenantId, pgTransactionManager: managerFor(tenantId) });

const userFixture = (overrides: Record<string, unknown>) => ({
  tenant_id: TENANT_ID,
  password: 'hash',
  role: 'editor',
  using2fa: false,
  ...overrides,
});

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingPG.clear(['users']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresUsersDAO', () => {
  describe('findMany', () => {
    it('should return all users matching an empty condition', async () => {
      await testingPG.setFixtures({
        users: [
          userFixture({ _id: 'active1', username: 'active1', email: 'active1@test.com' }),
          userFixture({ _id: 'active2', username: 'active2', email: 'active2@test.com' }),
        ],
      });

      const dao = makeDAO();
      const users = await dao.findMany();

      expect(users.map(u => u.username).sort()).toEqual(['active1', 'active2']);
    });

    it('should filter by an arbitrary field', async () => {
      await testingPG.setFixtures({
        users: [
          userFixture({ _id: 'active1', username: 'active1', email: 'active1@test.com' }),
          userFixture({ _id: 'active2', username: 'active2', email: 'active2@test.com' }),
        ],
      });

      const dao = makeDAO();
      const byUsername = await dao.findMany({ username: 'active1' });
      expect(byUsername.map(u => u.username)).toEqual(['active1']);

      const byEmail = await dao.findMany({ email: 'active2@test.com' });
      expect(byEmail.map(u => u.username)).toEqual(['active2']);
    });

    it('should exclude soft-deleted users by default', async () => {
      await testingPG.setFixtures({
        users: [
          userFixture({ _id: 'active1', username: 'active1', email: 'active1@test.com' }),
          userFixture({
            _id: 'deleted1',
            username: 'deleted1',
            email: 'deleted1@test.com',
            deletedAt: new Date(),
          }),
        ],
      });

      const dao = makeDAO();
      const users = await dao.findMany();

      expect(users.map(u => u.username)).toEqual(['active1']);
    });

    it('should include soft-deleted users when includeDeleted is set', async () => {
      await testingPG.setFixtures({
        users: [
          userFixture({
            _id: 'deleted1',
            username: 'deleted1',
            email: 'deleted1@test.com',
            deletedAt: new Date(),
          }),
        ],
      });

      const dao = makeDAO();
      const users = await dao.findMany({}, { includeDeleted: true });

      expect(users.map(u => u.username)).toEqual(['deleted1']);
    });

    it('should exclude the public/system user when notPublicUserFilter() is applied', async () => {
      const publicUserId = PUBLIC_USER_ID.toHexString();
      await testingPG.setFixtures({
        users: [
          userFixture({ _id: publicUserId, username: 'public', email: 'public@test.com' }),
          userFixture({ _id: 'active1', username: 'active1', email: 'active1@test.com' }),
        ],
      });

      const dao = makeDAO();
      const users = await dao.findMany(dao.notPublicUserFilter());

      expect(users.map(u => u.username)).toEqual(['active1']);
    });

    it('should return an empty array when nothing matches', async () => {
      const dao = makeDAO();
      const users = await dao.findMany({ username: 'nonexistent' });

      expect(users).toEqual([]);
    });
  });

  describe('findByIds', () => {
    it('should return the matching, non-deleted, non-public users', async () => {
      await testingPG.setFixtures({
        users: [
          userFixture({ _id: 'active1', username: 'active1', email: 'active1@test.com' }),
          userFixture({ _id: 'active2', username: 'active2', email: 'active2@test.com' }),
        ],
      });

      const dao = makeDAO();
      const users = await dao.findByIds(['active1', 'active2']);

      expect(users.map(u => u.username).sort()).toEqual(['active1', 'active2']);
    });

    it('should exclude soft-deleted users by default', async () => {
      await testingPG.setFixtures({
        users: [
          userFixture({
            _id: 'deleted1',
            username: 'deleted1',
            email: 'deleted1@test.com',
            deletedAt: new Date(),
          }),
        ],
      });

      const dao = makeDAO();
      const users = await dao.findByIds(['deleted1']);

      expect(users).toEqual([]);
    });

    it('should include soft-deleted users when includeDeleted is true', async () => {
      await testingPG.setFixtures({
        users: [
          userFixture({
            _id: 'deleted1',
            username: 'deleted1',
            email: 'deleted1@test.com',
            deletedAt: new Date(),
          }),
        ],
      });

      const dao = makeDAO();
      const users = await dao.findByIds(['deleted1'], { includeDeleted: true });

      expect(users.map(u => u.username)).toEqual(['deleted1']);
    });

    it('should exclude the public/system user even when explicitly requested', async () => {
      const publicUserId = PUBLIC_USER_ID.toHexString();
      await testingPG.setFixtures({
        users: [
          userFixture({ _id: publicUserId, username: 'public', email: 'public@test.com' }),
          userFixture({ _id: 'active1', username: 'active1', email: 'active1@test.com' }),
        ],
      });

      const dao = makeDAO();
      const users = await dao.findByIds([publicUserId, 'active1']);

      expect(users.map(u => u.username)).toEqual(['active1']);
    });

    it('should return an empty array for an empty id list', async () => {
      const dao = makeDAO();
      expect(await dao.findByIds([])).toEqual([]);
    });

    it('should return an empty array when no id matches', async () => {
      const dao = makeDAO();
      expect(await dao.findByIds(['nonexistent'])).toEqual([]);
    });
  });

  describe('listBasicInfo', () => {
    it('should return all non-deleted, non-public users with minimal shape', async () => {
      const publicUserId = PUBLIC_USER_ID.toHexString();
      await testingPG.setFixtures({
        users: [
          userFixture({ _id: 'active1', username: 'active1', email: 'active1@test.com' }),
          userFixture({
            _id: 'deleted1',
            username: 'deleted1',
            email: 'deleted1@test.com',
            deletedAt: new Date(),
          }),
          userFixture({ _id: publicUserId, username: 'public', email: 'public@test.com' }),
        ],
      });

      const dao = makeDAO();
      const users = await dao.listBasicInfo();

      expect(users).toEqual([{ _id: 'active1', username: 'active1' }]);
    });

    it('should return an empty array when there are no users', async () => {
      const dao = makeDAO();
      expect(await dao.listBasicInfo()).toEqual([]);
    });
  });

  describe('findByEmailOrUsername', () => {
    it('should match by exact username, case-insensitively', async () => {
      await testingPG.setFixtures({
        users: [userFixture({ _id: 'active1', username: 'active1', email: 'active1@test.com' })],
      });

      const dao = makeDAO();
      const users = await dao.findByEmailOrUsername('ACTIVE1');

      expect(users).toEqual([{ _id: 'active1', username: 'active1', email: 'active1@test.com' }]);
    });

    it('should match by exact email, case-insensitively', async () => {
      await testingPG.setFixtures({
        users: [userFixture({ _id: 'active2', username: 'active2', email: 'active2@test.com' })],
      });

      const dao = makeDAO();
      const users = await dao.findByEmailOrUsername('ACTIVE2@TEST.COM');

      expect(users.map(u => u.username)).toEqual(['active2']);
    });

    it('should not match a partial/prefix term', async () => {
      await testingPG.setFixtures({
        users: [userFixture({ _id: 'active1', username: 'active1', email: 'active1@test.com' })],
      });

      const dao = makeDAO();
      const users = await dao.findByEmailOrUsername('active');

      expect(users).toEqual([]);
    });

    it('should exclude soft-deleted users', async () => {
      await testingPG.setFixtures({
        users: [
          userFixture({
            _id: 'deleted1',
            username: 'deleted1',
            email: 'deleted1@test.com',
            deletedAt: new Date(),
          }),
        ],
      });

      const dao = makeDAO();
      const users = await dao.findByEmailOrUsername('deleted1');

      expect(users).toEqual([]);
    });

    it('should exclude the public/system user', async () => {
      const publicUserId = PUBLIC_USER_ID.toHexString();
      await testingPG.setFixtures({
        users: [userFixture({ _id: publicUserId, username: 'public', email: 'public@test.com' })],
      });

      const dao = makeDAO();
      const users = await dao.findByEmailOrUsername('public');

      expect(users).toEqual([]);
    });

    it('should return an empty array when nothing matches', async () => {
      const dao = makeDAO();
      expect(await dao.findByEmailOrUsername('nonexistent')).toEqual([]);
    });
  });
});
