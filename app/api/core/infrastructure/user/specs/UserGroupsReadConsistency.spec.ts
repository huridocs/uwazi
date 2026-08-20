import { PUBLIC_USER_ID, UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { UserGroupsDirectoryFactory } from '#api/core/infrastructure/factories/UserGroupsDirectoryFactory.js';
import { UserGroupsQueryServiceFactory } from '#api/core/infrastructure/factories/UserGroupsQueryServiceFactory.js';

/**
 * Parity is proven at the *contract* level, not at the DAO level (D4). The DAOs are generic
 * building blocks with no behaviour of their own; everything worth asserting — id handling,
 * prefix matching, escaping, member resolution and the users guards — lives in the Directory
 * and QueryService, and those are what these tests build.
 */
const f = getFixturesFactory();
const TENANT_ID = 'usergroups-read-consistency';

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
    f.usergroup('Group+Special (a|b)', []),
    f.usergroup('with lowercase', []),
  ],
};

// No read guarantees an order — ordering is a presentation concern, and Mongo's binary
// comparison and Postgres's collation would disagree anyway. Every assertion below sorts
// first; this list is in the order `Array.prototype.sort` produces.
const allNames = [
  'Empty',
  'Group+Special (a|b)',
  'With excluded members',
  'With two members',
  'with lowercase',
];

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
    { _id: f.idString('Group+Special (a|b)'), name: 'Group+Special (a|b)', members: [] },
    { _id: f.idString('with lowercase'), name: 'with lowercase', members: [] },
  ],
});

type TestConfig = { name: string; usePostgres: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('UserGroups read contract consistency', () => {
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

    const directory = () =>
      testingEnvironment.runWithContext(() => UserGroupsDirectoryFactory.default());

    const queryService = () =>
      testingEnvironment.runWithContext(() => UserGroupsQueryServiceFactory.default());

    // No read guarantees an order, so every assertion sorts first.
    const sortedByName = <T extends { name: string }>(groups: T[]): T[] =>
      [...groups].sort((a, b) => (a.name < b.name ? -1 : 1));

    const groupNamed = async (name: string) =>
      (await queryService().listUserGroups()).find(group => group.name === name);

    describe('listUserGroups', () => {
      it('should enrich members with username/role/email', async () => {
        expect((await groupNamed('With two members'))?.members).toMatchObject([
          { refId: f.idString('existing1'), username: 'existing1', role: UserRole.ADMIN },
          { refId: f.idString('existing2'), username: 'existing2', role: UserRole.EDITOR },
        ]);
      });

      it('should fall back to a bare refId for a dangling member reference', async () => {
        expect((await groupNamed('Empty'))?.members).toEqual([{ refId: f.idString('dangling') }]);
      });

      // The guards survived the move out of the DAO: the users scope is applied inside the
      // member resolution on both backends, so an excluded user degrades to a bare refId
      // rather than leaking a username.
      it('should fall back to a bare refId for a soft-deleted member and the public user', async () => {
        expect((await groupNamed('With excluded members'))?.members).toEqual([
          { refId: f.idString('deleted1') },
          { refId: PUBLIC_USER_ID.toHexString() },
        ]);
      });

      it('should return every group in the tenant', async () => {
        const groups = await queryService().listUserGroups();

        expect(sortedByName(groups).map(group => group.name)).toEqual(allNames);
      });
    });

    describe('getManyByIds', () => {
      it('should return the matching groups as views', async () => {
        const groups = await directory().getManyByIds([
          f.idString('With two members'),
          f.idString('Empty'),
        ]);

        expect(sortedByName(groups)).toEqual([
          { _id: f.idString('Empty'), name: 'Empty' },
          { _id: f.idString('With two members'), name: 'With two members' },
        ]);
      });

      it('should skip ids that match no group', async () => {
        const groups = await directory().getManyByIds([
          f.idString('Empty'),
          f.idString('missing'),
        ]);

        expect(groups).toEqual([{ _id: f.idString('Empty'), name: 'Empty' }]);
      });

      it('should return nothing for an empty id list', async () => {
        expect(await directory().getManyByIds([])).toEqual([]);
      });

      it('should ignore ids that are not object ids instead of throwing', async () => {
        const groups = await directory().getManyByIds(['public', f.idString('Empty')]);

        expect(groups).toEqual([{ _id: f.idString('Empty'), name: 'Empty' }]);
      });
    });

    describe('searchByName', () => {
      const names = async (term: string) =>
        sortedByName(await directory().searchByName(term)).map(group => group.name);

      it('should match by prefix', async () => {
        expect(await names('With')).toEqual([
          'With excluded members',
          'With two members',
          'with lowercase',
        ]);
      });

      it('should match case-insensitively', async () => {
        expect(await names('WITH LOW')).toEqual(['with lowercase']);
      });

      it('should not match on an infix', async () => {
        expect(await names('lowercase')).toEqual([]);
      });

      it('should treat metacharacters in the term literally', async () => {
        expect(await names('Group+Special (a|b)')).toEqual(['Group+Special (a|b)']);
      });

      it('should return every group for an empty term', async () => {
        expect(await names('')).toEqual(allNames);
      });

      it('should return nothing when no name matches', async () => {
        expect(await names('nothing matches this')).toEqual([]);
      });
    });

    describe('list', () => {
      it('should return every group as a view', async () => {
        const groups = await directory().list();

        expect(sortedByName(groups).map(group => group.name)).toEqual(allNames);
        groups.forEach(group =>
          expect(group).toEqual({ _id: expect.any(String), name: expect.any(String) })
        );
      });
    });
  });
});
