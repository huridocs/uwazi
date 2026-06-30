import { User } from '#api/core/domain/user/User.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UserRole } from '#shared/types/userSchema.js';
import { MongoUsergroupsDataSource } from '../MongoUsergroupsDataSource.js';

const f = getFixturesFactory();

const fixtures = {
  users: [
    f.user({ username: 'existing1', role: UserRole.ADMIN }),
    f.user({ username: 'existing2', role: UserRole.EDITOR }),
  ],
  usergroups: [
    f.usergroup('Empty', []),
    f.usergroup('With one member', [{ refId: f.id('existing1') }]),
    f.usergroup('With two members', [{ refId: f.id('existing1') }, { refId: f.id('existing2') }]),
  ],
};

const createDs = () => {
  const transactionManager = TransactionManagerFactory.default();
  const ds = new MongoUsergroupsDataSource(getConnection(), transactionManager);
  return { ds, transactionManager };
};

describe('MongoGroupsDataSource', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('updateUserGroups', () => {
    it('should add a user to a group', async () => {
      const { ds } = createDs();

      const user = new User({
        _id: f.id('newuser').toHexString(),
        username: 'newuser',
        role: UserRole.COLLABORATOR,
        email: 'newuser@provider.tld',
        groups: [{ _id: f.id('Empty').toHexString(), name: 'Empty' }],
      });

      await ds.updateUserGroups(user);

      const groups = await testingEnvironment.db.getAllFrom('usergroups');
      const emptyGroup = groups.find(g => g.name === 'Empty');

      expect(emptyGroup?.members).toMatchObject([{ refId: f.id('newuser') }]);
    });

    it('should add a user to multiple groups', async () => {
      const { ds } = createDs();

      const user = new User({
        _id: f.id('newuser').toHexString(),
        username: 'newuser',
        role: UserRole.COLLABORATOR,
        email: 'newuser@provider.tld',
        groups: [
          { _id: f.id('Empty').toHexString(), name: 'Empty' },
          { _id: f.id('With one member').toHexString(), name: 'With one member' },
        ],
      });

      await ds.updateUserGroups(user);

      const groups = await testingEnvironment.db.getAllFrom('usergroups');
      const emptyGroup = groups.find(group => group.name === 'Empty');
      const oneMemberGroup = groups.find(group => group.name === 'With one member');

      expect(emptyGroup?.members).toMatchObject([{ refId: f.id('newuser') }]);
      expect(oneMemberGroup?.members).toMatchObject([
        { refId: f.id('existing1') },
        { refId: f.id('newuser') },
      ]);
    });

    it('should remove a user if it is no longer in the group', async () => {
      const { ds } = createDs();

      const user = new User({
        _id: f.id('existing1').toHexString(),
        username: 'existing1',
        role: UserRole.ADMIN,
        email: 'existing1@provider.tld',
        groups: [],
      });

      await ds.updateUserGroups(user);

      const groups = await testingEnvironment.db.getAllFrom('usergroups');
      const oneMemberGroup = groups.find(group => group.name === 'With one member');
      const twoMemberGroup = groups.find(group => group.name === 'With two members');

      expect(oneMemberGroup?.members).toMatchObject([]);
      expect(twoMemberGroup?.members).toMatchObject([{ refId: f.id('existing2') }]);
    });

    it('should add and remove a user from different groups', async () => {
      const { ds } = createDs();

      const user = new User({
        _id: f.id('existing1').toHexString(),
        username: 'existing1',
        role: UserRole.ADMIN,
        email: 'existing1@provider.tld',
        groups: [{ _id: f.id('Empty').toHexString(), name: 'Empty' }],
      });

      await ds.updateUserGroups(user);

      const groups = await testingEnvironment.db.getAllFrom('usergroups');
      const emptyGroup = groups.find(group => group.name === 'Empty');
      const oneMemberGroup = groups.find(group => group.name === 'With one member');
      const twoMemberGroup = groups.find(group => group.name === 'With two members');

      expect(emptyGroup?.members).toMatchObject([{ refId: f.id('existing1') }]);
      expect(oneMemberGroup?.members).toMatchObject([]);
      expect(twoMemberGroup?.members).toMatchObject([{ refId: f.id('existing2') }]);
    });
  });

  describe('getUserGroups', () => {
    it('return user groups', async () => {
      const { ds } = createDs();

      const user = new User({
        _id: f.id('existing1').toHexString(),
        username: 'existing1',
        role: UserRole.ADMIN,
        email: 'existing1@provider.tld',
      });

      const foundGroups = await ds.getUserGroups(user);
      expect(foundGroups).toMatchObject([
        {
          _id: f.id('With one member').toHexString(),
          name: 'With one member',
        },
        {
          _id: f.id('With two members').toHexString(),
          name: 'With two members',
        },
      ]);
    });
  });
});
