/** @format */

import SHA256 from 'crypto-js/sha256';
import bcrypt from 'bcrypt';

const oldPassword = SHA256('oldPassword').toString();
const newPassword = bcrypt.hashSync('newPassword', 10);
const twofapassword = bcrypt.hashSync('2fapassword', 10);

export default {
  users: [
    { password: oldPassword, username: 'oldUser', email: 'old@email.com' },
    { password: newPassword, username: 'newUser', email: 'new@email.com' },
    {
      password: twofapassword,
      username: 'two-step-user',
      email: 'two-step-user@email.com',
      using2fa: true,
    },
  ],
  settings: [{ publicFormDestination: 'http://secret.place.io' }],
};
