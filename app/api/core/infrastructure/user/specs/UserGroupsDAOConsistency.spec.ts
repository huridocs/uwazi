import { PUBLIC_USER_ID, UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { UserGroupsDAOFactory } from '#api/core/infrastructure/factories/UserGroupsDAOFactory.js';

const f = getFixturesFactory();
const TENANT_ID = 'usergroups-dao-consistency';

const mongoFixtures: DBFixture = {
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
    f.usergroup('Empty', [{ refId: f.idString('dangling') }]),
    f.usergroup('With two members', [
      { refId: f.idString('existing1') },
      { refId: f.idString('existing2') },
    ]),
    f.usergroup('With excluded members', [
      { refId: f.idString('deleted1') },
      { refId: PUBLIC_USER_ID.toHexString() },
    ]),
  ],
};

const userRow = (id: string, username: string, role: string, deleted = false) => ({
  _id: id,
  username,
  role,
  email: `${username}@provider.tld`,
  password: 'hash',
  using2fa: false,
  ...(deleted && { deletedAt: new Date() }),
});

const pgFixtures = () => ({
  users: [
    userRow(f.idString('existing1'), 'existing1', 'admin'),
    userRow(f.idString('existing2'), 'existing2', 'editor'),
    userRow(f.idString('deleted1'), 'deleted1', 'collaborator', true),
    userRow(PUBLIC_USER_ID.toHexString(), 'public', 'collaborator'),
  ],
  usergroups: [
    { _id: f.idString('Empty'), name: 'Empty', members: [f.idString('dangling')] },
    {
      _id: f.idString('With two members'),
      name: 'With two members',
      members: [f.idString('existing1'), f.idString('existing2')],
    },
    {
      _id: f.idString('With excluded members'),
      name: 'With excluded members',
      members: [f.idString('deleted1'), PUBLIC_USER_ID.toHexString()],
    },
  ],
});

type TestConfig = { name: string; usePostgres: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('UserGroupsDAO consistency', () => {
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

    const getDAO = () => testingEnvironment.runWithContext(() => UserGroupsDAOFactory.default());

    it('should enrich members with username/role/email', async () => {
      const dao = getDAO();
      const all = await dao.getAll();
      const withTwoMembers = all.find(group => group.name === 'With two members');

      expect(withTwoMembers?.members).toMatchObject([
        { refId: f.idString('existing1'), username: 'existing1', role: UserRole.ADMIN },
        { refId: f.idString('existing2'), username: 'existing2', role: UserRole.EDITOR },
      ]);
    });

    it('should fall back to a bare refId for a dangling member reference', async () => {
      const dao = getDAO();
      const all = await dao.getAll();
      const empty = all.find(group => group.name === 'Empty');

      expect(empty?.members).toEqual([{ refId: f.idString('dangling') }]);
    });

    it('should fall back to a bare refId for a soft-deleted member and the public user', async () => {
      const dao = getDAO();
      const all = await dao.getAll();
      const withExcluded = all.find(group => group.name === 'With excluded members');

      expect(withExcluded?.members).toEqual([
        { refId: f.idString('deleted1') },
        { refId: PUBLIC_USER_ID.toHexString() },
      ]);
    });
  });
});
