import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { PostgresUsersDAO } from '../PostgresUsersDAO.js';
import { PostgresUserGroupsDAO } from '../PostgresUserGroupsDAO.js';

const TENANT_ID = 'test-tenant';

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const makeDAO = (tenantId = TENANT_ID) => {
  const deps = { tenantId, pgTransactionManager: managerFor(tenantId) };
  return new PostgresUserGroupsDAO({ ...deps, usersDAO: new PostgresUsersDAO(deps) });
};

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
  await testingPG.clear(['users', 'usergroups']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresUserGroupsDAO', () => {
  describe('getAll', () => {
    it('should return groups with empty members', async () => {
      await testingPG.setFixtures({
        usergroups: [{ _id: 'empty', tenant_id: TENANT_ID, name: 'Empty', members: [] }],
      });

      const dao = makeDAO();
      const all = await dao.getAll();
      const empty = all.find(group => group.name === 'Empty');

      expect(empty?.members).toEqual([]);
    });

    it('should enrich members with username/role/email', async () => {
      await testingPG.setFixtures({
        users: [
          userFixture({ _id: 'existing1', username: 'existing1', email: 'existing1@test.com' }),
          userFixture({ _id: 'existing2', username: 'existing2', email: 'existing2@test.com' }),
        ],
        usergroups: [
          {
            _id: 'with-two-members',
            tenant_id: TENANT_ID,
            name: 'With two members',
            members: ['existing1', 'existing2'],
          },
        ],
      });

      const dao = makeDAO();
      const all = await dao.getAll();
      const withTwoMembers = all.find(group => group.name === 'With two members');

      expect(withTwoMembers?.members).toMatchObject([
        { refId: 'existing1', username: 'existing1', role: 'editor' },
        { refId: 'existing2', username: 'existing2', role: 'editor' },
      ]);
    });

    it('should fall back to a bare refId for an orphaned member reference', async () => {
      await testingPG.setFixtures({
        usergroups: [
          {
            _id: 'empty',
            tenant_id: TENANT_ID,
            name: 'Empty',
            members: ['deletedUser'],
          },
        ],
      });

      const dao = makeDAO();
      const all = await dao.getAll();
      const emptyGroup = all.find(group => group.name === 'Empty');

      expect(emptyGroup?.members).toEqual([{ refId: 'deletedUser' }]);
    });

    it('should fall back to a bare refId for a soft-deleted member', async () => {
      await testingPG.setFixtures({
        users: [
          userFixture({
            _id: 'deleted1',
            username: 'deleted1',
            email: 'deleted1@test.com',
            deletedAt: new Date(),
          }),
        ],
        usergroups: [
          { _id: 'empty', tenant_id: TENANT_ID, name: 'Empty', members: ['deleted1'] },
        ],
      });

      const dao = makeDAO();
      const all = await dao.getAll();
      const emptyGroup = all.find(group => group.name === 'Empty');

      expect(emptyGroup?.members).toEqual([{ refId: 'deleted1' }]);
    });

    it('should fall back to a bare refId for the public user', async () => {
      const publicUserId = PUBLIC_USER_ID.toHexString();
      await testingPG.setFixtures({
        users: [
          userFixture({ _id: publicUserId, username: 'public', email: 'public@test.com' }),
        ],
        usergroups: [
          { _id: 'empty', tenant_id: TENANT_ID, name: 'Empty', members: [publicUserId] },
        ],
      });

      const dao = makeDAO();
      const all = await dao.getAll();
      const emptyGroup = all.find(group => group.name === 'Empty');

      expect(emptyGroup?.members).toEqual([{ refId: publicUserId }]);
    });
  });
});
