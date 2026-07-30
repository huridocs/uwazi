import db, { DBFixture } from '#api/utils/testing_db.js';
import { UserRole } from '#shared/types/userSchema.js';

const userId = db.id();
const secretedUserId = db.id();

const fixtures: DBFixture = {
  settings: [
    {
      site_name: 'Uwazi Collection',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
  users: [
    {
      _id: userId,
      username: 'username',
      email: 'test@email.com',
      role: UserRole.ADMIN,
    },
    {
      _id: secretedUserId,
      username: 'otheruser',
      email: 'another@email.com',
      role: UserRole.ADMIN,
      secret: 'correctSecret',
    },
  ],
};

export default fixtures;
export { userId, secretedUserId };
