/** @format */

import db from 'api/utils/testing_db';

const userId = db.id();
const secretedUserId = db.id();

export default {
  users: [
    {
      _id: userId,
      username: 'username',
      email: 'test@email.com',
      role: 'admin',
    },
    {
      _id: secretedUserId,
      username: 'otheruser',
      email: 'another@email.com',
      role: 'admin',
      secret: 'correctSecret',
    },
  ],
};

export { userId, secretedUserId };
