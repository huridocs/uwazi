import db from 'api/utils/testing_db';

const group1Id = db.id();
const user1Id = db.id();
const user2Id = db.id();

export default {
  usergroups: [{ _id: group1Id, name: 'Group 1', members: [user1Id] }],
  users: [
    {
      _id: user1Id,
      password: 'pass1',
      username: 'user1',
      email: 'test@email.com',
      role: 'user',
    },
    {
      _id: user2Id,
      password: 'pass2',
      username: 'user2',
      email: 'test@email.com',
      role: 'user',
    },
  ],
};

export { group1Id, user1Id, user2Id };
