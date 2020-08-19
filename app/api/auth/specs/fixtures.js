/** @format */

import SHA256 from 'crypto-js/sha256';
import bcrypt from 'bcryptjs';

const oldPassword = SHA256('oldPassword').toString();
const newPassword = bcrypt.hashSync('newPassword', 10);

export default {
  users: [
    { password: oldPassword, username: 'oldUser', email: 'old@email.com' },
    { password: newPassword, username: 'newUser', email: 'new@email.com' },
  ],
  settings: [{ publicFormDestination: 'http://secret.place.io' }],
};
