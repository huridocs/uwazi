import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UserRole } from '#shared/types/userSchema.js';
import { MongoUserGroupsDAO } from '../MongoUserGroupsDAO.js';

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

const createDao = () =>
  new MongoUserGroupsDAO(getConnection(), TransactionManagerFactory.default());

describe('MongoUserGroupsDAO', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  // Mirrors PostgresUserGroupsDAO.spec.ts's getGroupsByUserIds cases — the two must agree
  // on signature and Map semantics, since the Directory uses them interchangeably.
  describe('getGroupsByUserIds', () => {
    it('should return each user mapped to the groups they belong to', async () => {
      const map = await createDao().getGroupsByUserIds([
        f.idString('existing1'),
        f.idString('existing2'),
      ]);

      expect(map.get(f.idString('existing1'))).toEqual(
        expect.arrayContaining([
          { _id: f.idString('With one member'), name: 'With one member' },
          { _id: f.idString('With two members'), name: 'With two members' },
        ])
      );
      expect(map.get(f.idString('existing2'))).toEqual([
        { _id: f.idString('With two members'), name: 'With two members' },
      ]);
    });

    it('should map a user in no groups to an empty array', async () => {
      const map = await createDao().getGroupsByUserIds([f.idString('deleted1')]);

      expect(map.get(f.idString('deleted1'))).toEqual([]);
    });

    it('should not include a group member that was not passed in userIds', async () => {
      const map = await createDao().getGroupsByUserIds([f.idString('existing1')]);

      expect(map.has(f.idString('existing2'))).toBe(false);
      expect(map.get(f.idString('existing1'))).toEqual(
        expect.arrayContaining([{ _id: f.idString('With one member'), name: 'With one member' }])
      );
    });

    it('should ignore groups the requested users do not belong to', async () => {
      const map = await createDao().getGroupsByUserIds([f.idString('existing2')]);

      expect(map.get(f.idString('existing2'))!.map(group => group.name)).toEqual([
        'With two members',
      ]);
    });

    it('should return group ids as strings', async () => {
      const map = await createDao().getGroupsByUserIds([f.idString('existing1')]);

      map.get(f.idString('existing1'))!.forEach(group => {
        expect(typeof group._id).toBe('string');
      });
    });

    it('should return an empty map without querying when userIds is empty', async () => {
      const map = await createDao().getGroupsByUserIds([]);

      expect(map.size).toBe(0);
    });
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
