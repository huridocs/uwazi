import { PUBLIC_USER_ID, UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { UsersQueryServiceFactory } from '#api/core/infrastructure/factories/UsersQueryServiceFactory.js';

const f = getFixturesFactory();
const TENANT_ID = 'users-query-service-consistency';

// One declaration for both backends: setFixtures mirrors `users`/`usergroups` into
// Postgres, shape-converting members and filling the NOT NULL columns Mongo omits.
const fixtures: DBFixture = {
  users: [
    f.user({ username: 'active1', role: UserRole.ADMIN, email: 'active1@test.com' }),
    f.user({ username: 'active2', role: UserRole.EDITOR, email: 'active2@test.com' }),
    f.user({
      username: 'deleted',
      role: UserRole.EDITOR,
      email: 'deleted@test.com',
      deletedAt: new Date(),
    }),
    {
      _id: PUBLIC_USER_ID,
      username: 'public',
      role: UserRole.COLLABORATOR,
      email: 'public@uwazi.local',
    },
    f.user({
      username: 'withsensitive',
      role: UserRole.ADMIN,
      email: 'sensitive@test.com',
      password: 'hash',
    }),
  ],
  usergroups: [
    f.usergroup('Group A', [{ refId: f.idString('active1') }]),
    f.usergroup('Group B', [
      { refId: f.idString('active1') },
      { refId: f.idString('active2') },
    ]),
  ],
};

type TestConfig = { name: string; usePostgres: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('UsersQueryService consistency', () => {
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
        featureFlags: { postgresUsers: usePostgres, postgresUsergroups: usePostgres },
      });

      await testingEnvironment.setFixtures(fixtures);
    });

    const getQueryService = () =>
      testingEnvironment.runWithContext(() => UsersQueryServiceFactory.default());

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
          expect(user).not.toHaveProperty('password');
        });
      });

      it('should exclude deleted users', async () => {
        const queryService = getQueryService();
        const users = await queryService.listWithGroups();

        expect(users.find(u => u.username === 'deleted')).toBeUndefined();
      });

      it('should exclude the system user', async () => {
        const queryService = getQueryService();
        const users = await queryService.listWithGroups();

        expect(users.find(u => u.username === 'public')).toBeUndefined();
      });

      it('should return users with groups', async () => {
        const queryService = getQueryService();
        const users = await queryService.listWithGroups();

        const active1 = users.find(user => user.username === 'active1');
        expect(active1!.groups.map(g => g.name).sort()).toEqual(['Group A', 'Group B']);

        const active2 = users.find(user => user.username === 'active2');
        expect(active2!.groups.map(g => g.name)).toEqual(['Group B']);
      });

      it('should filter by query', async () => {
        const queryService = getQueryService();
        const users = await queryService.listWithGroups({ username: 'active2' });

        expect(users.length).toBe(1);
        expect(users[0].email).toBe('active2@test.com');
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
});
