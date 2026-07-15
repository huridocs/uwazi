import SHA256 from 'crypto-js/sha256';
import db from '#api/utils/testing_db.js';
import { PUBLIC_USER_ID, UserRole } from '#api/core/domain/user/User.js';

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
      role: UserRole.ADMIN,
    },
    {
      _id: recoveryUserId,
      password: 'anotherpassword',
      username: 'anotherusername',
      email: 'recovery@email.com',
      role: UserRole.EDITOR,
      using2fa: false,
    },
    {
      _id: blockedUserId,
      password: 'anotherpassword',
      username: 'blockedusername',
      email: 'blocked@email.com',
      role: UserRole.EDITOR,
      using2fa: false,
      failedLogins: 6,
      accountLocked: true,
      accountUnlockCode: 'unlockcode',
    },
    {
      _id: userToDelete,
      username: 'userToDelete',
      email: 'userToDelete@email.com',
      role: UserRole.ADMIN,
      using2fa: false,
      failedLogins: 0,
      accountLocked: false,
    },
    {
      _id: userToDelete2,
      username: 'userToDelete2',
      email: 'userToDelete2@email.com',
      role: UserRole.EDITOR,
      using2fa: false,
    },
    {
      _id: PUBLIC_USER_ID,
      username: 'PublicUser',
      email: 'public@uwazi.local',
      password: 'wontbeused',
      role: UserRole.COLLABORATOR,
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
  PUBLIC_USER_ID,
};
