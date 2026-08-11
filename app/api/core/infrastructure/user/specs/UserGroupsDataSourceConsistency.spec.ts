import { User, UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { UserGroupsDataSourceFactory } from '#api/core/infrastructure/factories/UserGroupsDataSourceFactory.js';

const f = getFixturesFactory();
const TENANT_ID = 'usergroups-datasource-consistency';

const mongoFixtures: DBFixture = {
  users: [
    f.user({ username: 'existing1', role: UserRole.ADMIN }),
    f.user({ username: 'existing2', role: UserRole.EDITOR }),
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

const pgFixtures = () => ({
  users: [
    {
      _id: f.idString('existing1'),
      username: 'existing1',
      role: 'admin',
      email: 'existing1@provider.tld',
      password: 'hash',
      using2fa: false,
    },
    {
      _id: f.idString('existing2'),
      username: 'existing2',
      role: 'editor',
      email: 'existing2@provider.tld',
      password: 'hash',
      using2fa: false,
    },
  ],
  usergroups: [
    { _id: f.idString('Empty'), name: 'Empty', members: [] },
    {
      _id: f.idString('With one member'),
      name: 'With one member',
      members: [f.idString('existing1')],
    },
    {
      _id: f.idString('With two members'),
      name: 'With two members',
      members: [f.idString('existing1'), f.idString('existing2')],
    },
  ],
});

type TestConfig = { name: string; usePostgres: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('UserGroupsDataSource consistency', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresUsergroups: usePostgres, postgresUsers: usePostgres },
      });

      if (usePostgres) {
        await testingPG.setFixtures(pgFixtures());
      } else {
        await testingEnvironment.setFixtures(mongoFixtures);
      }
    });

    const getDS = () =>
      testingEnvironment.runWithContext(() => UserGroupsDataSourceFactory.default());

    // Mongo ids are hex ObjectId strings; Postgres ids are the plain fixture keys.
    const groupId = (name: string) => (usePostgres ? f.idString(name) : f.id(name).toHexString());
    const userId = (key: string) => (usePostgres ? f.idString(key) : f.id(key).toHexString());

    const makeUser = (id: string, groups: { _id: string; name: string }[] = []) =>
      new User({
        _id: id,
        username: 'test',
        role: UserRole.COLLABORATOR,
        email: 'test@provider.tld',
        groups,
      });

    describe('updateUserGroups / getUserGroups', () => {
      it('should add a user to a group', async () => {
        const ds = getDS();
        const newUserId = usePostgres ? 'new-user' : f.id('newuser').toHexString();

        await ds.updateUserGroups(makeUser(newUserId, [{ _id: groupId('Empty'), name: 'Empty' }]));

        const foundGroups = await ds.getUserGroups(makeUser(newUserId));
        expect(foundGroups.map(g => g.name)).toEqual(['Empty']);
      });

      it('should remove a user if it is no longer in the group', async () => {
        const ds = getDS();

        await ds.updateUserGroups(makeUser(userId('existing1'), []));

        const remainingGroups = await ds.getUserGroups(makeUser(userId('existing1')));
        expect(remainingGroups).toEqual([]);
      });

      it('should return the groups a user belongs to', async () => {
        const ds = getDS();

        const foundGroups = await ds.getUserGroups(makeUser(userId('existing1')));

        expect(foundGroups.map(g => g.name).sort()).toEqual(
          ['With one member', 'With two members'].sort()
        );
      });
    });

    describe('removeUsersFromGroups', () => {
      it('should remove the given users from every group', async () => {
        const ds = getDS();

        await ds.removeUsersFromGroups([userId('existing1')]);

        const remainingGroups = await ds.getUserGroups(makeUser(userId('existing1')));
        expect(remainingGroups).toEqual([]);
      });
    });

    describe('create / update / delete', () => {
      it('should create, then rename, then delete a group', async () => {
        const ds = getDS();

        const created = await ds.create({ name: 'New group', memberIds: [] });
        const updated = await ds.update({ id: created.id, name: 'Renamed', memberIds: [] });
        expect(updated.name).toBe('Renamed');

        await ds.delete([created.id]);

        const uniqueCheck = await ds.checkUniqueName('Renamed');
        expect(uniqueCheck.isOk()).toBe(true);
      });
    });

    describe('checkUniqueName', () => {
      it('should be case-insensitive and excludable by id', async () => {
        const ds = getDS();

        expect((await ds.checkUniqueName('empty')).isError()).toBe(true);
        expect((await ds.checkUniqueName('nonexistent')).isOk()).toBe(true);
        expect((await ds.checkUniqueName('Empty', groupId('Empty'))).isOk()).toBe(true);
      });
    });
  });
});
