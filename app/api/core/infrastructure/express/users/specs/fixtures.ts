import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { UserRole } from '#shared/types/userSchema.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';

const f = getFixturesFactory();

const fixtures: DBFixture = {
  users: [
    f.user({ username: 'existinguser', role: UserRole.EDITOR, email: 'existing@test.com' }),
    f.user({ username: 'admin', role: UserRole.ADMIN, email: 'admin@test.com' }),
    f.user({
      username: 'deletedUser',
      role: UserRole.ADMIN,
      email: 'deleted@test.com',
      deletedAt: '1',
    }),
    {
      _id: new ObjectId(PUBLIC_USER_ID),
      username: 'public',
      role: UserRole.COLLABORATOR,
      email: 'public@uwazi.local',
    },
  ],
  settings: [
    {
      site_name: 'Uwazi',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
  usergroups: [
    f.usergroup('Researchers', [{ refId: f.idString('existinguser') }]),
    f.usergroup('Journalists', []),
    f.usergroup('Investigators', []),
  ],
};

export { fixtures, f };
