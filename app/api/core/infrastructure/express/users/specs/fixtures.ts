import { ObjectId } from 'mongodb';
import { DBFixture } from '#api/utils/testing_db.js';
import { UserRole } from '#shared/types/userSchema.js';

const existingUserId = new ObjectId();

const existingUser = {
  _id: existingUserId,
  username: 'existinguser',
  role: UserRole.EDITOR,
  email: 'existing@test.com',
};

const fixtures: DBFixture = {
  users: [existingUser],
  settings: [
    {
      site_name: 'Uwazi',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
};

export { fixtures, existingUserId };
