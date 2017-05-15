import db from 'api/utils/testing_db';
import SHA256 from 'crypto-js/sha256';

const userId = db.id();
const recoveryUserId = db.id();
const expectedKey = SHA256('recovery@email.com' + 2000).toString();

export default {
  users: [
    {_id: userId, password: 'password', username: 'username', email: 'test@email.com', role: 'admin'},
    {_id: recoveryUserId, password: 'password', username: 'username', email: 'recovery@email.com', role: 'editor'}
  ],
  passwordrecoveries: [
    {_id: db.id(), key: expectedKey, user: recoveryUserId}
  ]
};

export {
  userId,
  recoveryUserId,
  expectedKey
};
