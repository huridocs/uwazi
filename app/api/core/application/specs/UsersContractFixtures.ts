import { PUBLIC_USER_ID, UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';

/**
 * The single fixture set behind both users contract suites (plan 04).
 *
 * One declaration serves both backends — `testingEnvironment.setFixtures` mirrors `users`
 * and `usergroups` into Postgres, converting `members: [{refId}]` to `string[]` and filling
 * the NOT NULL columns Mongo fixtures omit. It also serves both *suites*, so a field added
 * for `UsersDirectory` cannot quietly leave `UsersQueryService` testing something else.
 */

const f = getFixturesFactory();

const TENANT_ID = 'users-contract';

/** Well-formed but absent, and malformed. Both are misses, never exceptions (A9). */
const UNKNOWN_ID = 'ffffffffffffffffffffffff';
const MALFORMED_ID = 'not-a-valid-id';

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
    f.user({
      username: 'sensitive',
      role: UserRole.ADMIN,
      email: 'sensitive@test.com',
      password: 'hash',
      secret: 's',
      failedLogins: 3,
      accountUnlockCode: 'abc',
      accountLocked: true,
      using2fa: true,
    }),
    {
      _id: PUBLIC_USER_ID,
      username: 'public',
      role: UserRole.COLLABORATOR,
      email: 'public@uwazi.local',
    },
  ],
  usergroups: [
    f.usergroup('Group A', [{ refId: f.idString('active1') }]),
    // `deleted` is a member on purpose: getActor resolves soft-deleted users and must still
    // carry their groups, because job actors lose permissions silently without them (D3).
    f.usergroup('Group B', [
      { refId: f.idString('active1') },
      { refId: f.idString('active2') },
      { refId: f.idString('deleted') },
    ]),
  ],
};

const view = {
  active1: {
    _id: f.idString('active1'),
    username: 'active1',
    role: UserRole.ADMIN,
    email: 'active1@test.com',
  },
  active2: {
    _id: f.idString('active2'),
    username: 'active2',
    role: UserRole.EDITOR,
    email: 'active2@test.com',
  },
  deleted: {
    _id: f.idString('deleted'),
    username: 'deleted',
    role: UserRole.EDITOR,
    email: 'deleted@test.com',
  },
  sensitive: {
    _id: f.idString('sensitive'),
    username: 'sensitive',
    role: UserRole.ADMIN,
    email: 'sensitive@test.com',
  },
};

const groupA = { _id: f.idString('Group A'), name: 'Group A' };
const groupB = { _id: f.idString('Group B'), name: 'Group B' };

/**
 * Nothing orders users or groups on either backend — Mongo returns natural collection order,
 * Postgres whatever the plan produces. Sorting here rather than asserting an incidental
 * match is what stops these suites becoming a flake the first time a query shape changes.
 */
const byUsername = <T extends { username: string }>(users: T[]) =>
  [...users].sort((a, b) => a.username.localeCompare(b.username));

const withSortedGroups = <T extends { groups: { name: string }[] }>(profile: T) => ({
  ...profile,
  groups: [...profile.groups].sort((a, b) => a.name.localeCompare(b.name)),
});

/**
 * `deletedAt` is in this list because getActor sees a soft-deleted user: it may name them,
 * it may not disclose that they are gone.
 */
const CREDENTIAL_FIELDS = [
  'password',
  'secret',
  'failedLogins',
  'accountUnlockCode',
  'deletedAt',
] as const;

const expectNoCredentials = (model: object) => {
  CREDENTIAL_FIELDS.forEach(field => expect(model).not.toHaveProperty(field));
};

type TestConfig = { name: string; usePostgres: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

export {
  f,
  TENANT_ID,
  UNKNOWN_ID,
  MALFORMED_ID,
  fixtures,
  view,
  groupA,
  groupB,
  byUsername,
  withSortedGroups,
  CREDENTIAL_FIELDS,
  expectNoCredentials,
  testConfigs,
};
