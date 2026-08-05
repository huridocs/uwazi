import { PUBLIC_USER_ID, UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import testingDB, { DBFixture } from '#api/utils/testing_db.js';

const factory = getFixturesFactory();

const withsensitiveId = testingDB.id();

const fixtures: DBFixture = {
  users: [
    factory.user({ username: 'active1', role: UserRole.ADMIN, email: 'active1@test.com' }),
    factory.user({
      username: 'active2',
      role: UserRole.EDITOR,
      email: 'active2@test.com',
      password: 's3cret',
    }),
    factory.user({
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
    {
      _id: withsensitiveId,
      username: 'withsensitive',
      role: UserRole.ADMIN,
      email: 'sensitive@test.com',
      password: 'hash',
      secret: 'mysecret',
      failedLogins: 3,
      accountUnlockCode: 'abc123',
      accountLocked: false,
      using2fa: true,
    },
  ],
  usergroups: [
    factory.usergroup('Group A', [{ refId: factory.idString('active1') }]),
    factory.usergroup('Group B', [
      { refId: factory.idString('active1') },
      { refId: factory.idString('active2') },
    ]),
  ],
};

export { fixtures, factory, withsensitiveId };
