import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UserRole } from '#shared/types/userSchema.js';
import { MongoUserGroupsDAO } from '../MongoUserGroupsDAO.js';
import { MongoUsersDAO } from '../MongoUsersDAO.js';

const f = getFixturesFactory();

const fixtures = {
  users: [
    f.user({ username: 'existing1', role: UserRole.ADMIN }),
    f.user({ username: 'existing2', role: UserRole.EDITOR }),
    f.user({ username: 'deleted1', role: UserRole.COLLABORATOR, deletedAt: new Date() }),
    {
      _id: PUBLIC_USER_ID,
      username: 'public',
      role: UserRole.COLLABORATOR,
      email: 'public@provider.tld',
    },
  ],
  usergroups: [
    f.usergroup('Empty', []),
    f.usergroup('With one member', [{ refId: f.idString('existing1') }]),
    f.usergroup('With two members', [
      { refId: f.idString('existing1') },
      { refId: f.idString('existing2') },
    ]),
  ],
};

const createDao = () => {
  const transactionManager = TransactionManagerFactory.default();
  const usersDAO = new MongoUsersDAO({ db: getConnection(), transactionManager });
  return new MongoUserGroupsDAO(getConnection(), transactionManager, usersDAO);
};

describe('MongoUserGroupsDAO', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('getAll', () => {
    it('should return groups with empty members', async () => {
      const dao = createDao();

      const all = await dao.getAll();
      const empty = all.find(group => group.name === 'Empty');

      expect(empty?.members).toEqual([]);
    });

    it('should enrich members with username/role/email', async () => {
      const dao = createDao();

      const all = await dao.getAll();
      const withTwoMembers = all.find(group => group.name === 'With two members');

      expect(withTwoMembers?.members).toMatchObject([
        { refId: f.idString('existing1'), username: 'existing1', role: UserRole.ADMIN },
        { refId: f.idString('existing2'), username: 'existing2', role: UserRole.EDITOR },
      ]);
    });

    it('should fall back to a bare refId for an orphaned member reference', async () => {
      const dao = createDao();
      const collection = getConnection().collection('usergroups');
      await collection.updateOne(
        { _id: f.id('Empty') },
        { $set: { members: [{ refId: f.idString('deletedUser') }] } }
      );

      const all = await dao.getAll();
      const emptyGroup = all.find(group => group.name === 'Empty');

      expect(emptyGroup?.members).toEqual([{ refId: f.idString('deletedUser') }]);
    });

    it('should fall back to a bare refId for a soft-deleted member', async () => {
      const dao = createDao();
      const collection = getConnection().collection('usergroups');
      await collection.updateOne(
        { _id: f.id('Empty') },
        { $set: { members: [{ refId: f.idString('deleted1') }] } }
      );

      const all = await dao.getAll();
      const emptyGroup = all.find(group => group.name === 'Empty');

      expect(emptyGroup?.members).toEqual([{ refId: f.idString('deleted1') }]);
    });

    it('should fall back to a bare refId for the public user', async () => {
      const dao = createDao();
      const collection = getConnection().collection('usergroups');
      await collection.updateOne(
        { _id: f.id('Empty') },
        { $set: { members: [{ refId: PUBLIC_USER_ID.toHexString() }] } }
      );

      const all = await dao.getAll();
      const emptyGroup = all.find(group => group.name === 'Empty');

      expect(emptyGroup?.members).toEqual([{ refId: PUBLIC_USER_ID.toHexString() }]);
    });
  });
});
