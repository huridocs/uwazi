import { UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';

const f = getFixturesFactory();

const fixtures = {
  users: [
    f.user({ username: 'admin', role: UserRole.ADMIN, email: 'admin@test.com' }),
    f.user({ username: 'editor', role: UserRole.EDITOR, email: 'editor@test.com' }),
    f.user({
      username: 'gone',
      role: UserRole.EDITOR,
      email: 'gone@test.com',
      deletedAt: new Date(),
    }),
  ],
  usergroups: [f.usergroup('Researchers', [{ refId: f.idString('editor') }])],
};

export { f, fixtures };
