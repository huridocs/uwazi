import db from 'api/utils/testing_db';

const group1Id = db.id();
const group2Id = db.id();
const user1Id = db.id();
const user2Id = db.id();
const user3Id = db.id();

export default {
  usergroups: [
    { _id: group1Id, name: 'Group 1', members: [{ _id: user2Id }] },
    { _id: group2Id, name: 'Group 2', members: [{ _id: user1Id }, { _id: user3Id }] },
  ],
  users: [
    {
      _id: user1Id,
      password: 'pass1',
      username: 'user1',
      email: 'user1@email.com',
      role: 'admin',
    },
    {
      _id: user2Id,
      password: 'pass2',
      username: 'user2',
      email: 'user2@email.com',
      role: 'editor',
    },
    {
      _id: user3Id,
      password: 'pass3',
      username: 'user3',
      email: 'user3@email.com',
      role: 'collaborator',
    },
  ],
};

export { group1Id, group2Id, user1Id, user2Id, user3Id };
