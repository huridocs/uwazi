import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { UserRole } from '#shared/types/userSchema.js';

const f = getFixturesFactory();

const fixtures: DBFixture = {
  users: [
    f.user({ username: 'existinguser', role: UserRole.EDITOR, email: 'existing@test.com' }),
    f.user({
      username: 'deletedUser',
      role: UserRole.ADMIN,
      email: 'deleted@test.com',
      deletedAt: '1',
    }),
  ],
  settings: [
    {
      site_name: 'Uwazi',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
  usergroups: [
    f.usergroup('Researchers', [{ refId: f.id('existinguser') }]),
    f.usergroup('Journalists', []),
    f.usergroup('Investigators', []),
  ],
};

export { fixtures, f };
