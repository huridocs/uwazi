import db from 'api/utils/testing_db';
import SHA256 from 'crypto-js/sha256';

const userId = db.id();
const group1Id = db.id();
const group2Id = db.id();
const recoveryUserId = db.id();
const blockedUserId = db.id();
const userToDelete = db.id();
const userToDelete2 = db.id();
const expectedKey = SHA256(`recovery@email.com${2000}`).toString();

export default {
  users: [
    {
      _id: userId,
      password: 'password',
      username: 'username',
      email: 'test@email.com',
      role: 'admin',
    },
    {
      _id: recoveryUserId,
      password: 'anotherpassword',
      username: 'anotherusername',
      email: 'recovery@email.com',
      role: 'editor',
      using2fa: false,
    },
    {
      _id: blockedUserId,
      password: 'anotherpassword',
      username: 'blockedusername',
      email: 'blocked@email.com',
      role: 'editor',
      using2fa: false,
      failedLogins: 6,
      accountLocked: true,
      accountUnlockCode: 'unlockcode',
    },
    {
      _id: userToDelete,
      username: 'userToDelete',
      email: 'userToDelete@email.com',
      role: 'admin',
      using2fa: false,
      failedLogins: 0,
      accountLocked: false,
    },
    {
      _id: userToDelete2,
      username: 'userToDelete2',
      email: 'userToDelete2@email.com',
      role: 'editor',
      using2fa: false,
    },
  ],
  passwordrecoveries: [{ _id: db.id(), key: expectedKey, user: recoveryUserId }],
  settings: [
    { site_name: 'Uwazi instance' }, // eslint-disable-line camelcase
  ],
  usergroups: [
    { _id: group1Id, name: 'Group 1', members: [{ refId: recoveryUserId.toString() }] },
    {
      _id: group2Id,
      name: 'Group 2',
      members: [{ refId: userId.toString() }, { refId: userToDelete2.toString() }],
    },
    {
      _id: db.id(),
      name: 'Group 3',
      members: [{ refId: userToDelete.toString() }, { refId: userToDelete2.toString() }],
    },
  ],
};

export {
  userId,
  recoveryUserId,
  expectedKey,
  group1Id,
  group2Id,
  userToDelete,
  userToDelete2,
  blockedUserId,
};
