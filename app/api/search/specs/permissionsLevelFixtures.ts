import { testingDB, DBFixture } from 'api/utils/testing_db';

const users = {
  user1: {
    _id: 'User1',
    username: 'User 1',
    role: 'collaborator',
    email: 'one@test.com',
  },
  user2: {
    _id: 'User2',
    username: 'User 2',
    role: 'collaborator',
    email: 'two@test.com',
  },
  user3: { _id: testingDB.id() },
};
const group1 = testingDB.id();
const group2 = testingDB.id();

export const permissionsLevelFixtures: DBFixture = {
  entities: [
    {
      title: 'ent1',
      shareId: 'ent1',
      language: 'es',
      published: true,
      permissions: [
        { level: 'read', _id: users.user1._id, type: 'user' },
        { level: 'read', _id: group1, type: 'group' },
      ],
    },
    {
      title: 'ent2',
      shareId: 'ent2',
      language: 'es',
      published: true,
      permissions: [
        { level: 'read', _id: users.user1._id, type: 'user' },
        { level: 'read', _id: group1, type: 'group' },
      ],
    },
    {
      title: 'ent3',
      shareId: 'ent3',
      language: 'es',
      published: true,
      permissions: [
        { level: 'write', _id: users.user1._id, type: 'user' },
        { level: 'read', _id: users.user2._id, type: 'user' },
        { level: 'write', _id: users.user3._id, type: 'user' },
        { level: 'read', _id: group1, type: 'group' },
      ],
    },
    {
      title: 'ent3',
      shareId: 'ent3',
      language: 'en',
      published: true,
      permissions: [
        { level: 'write', _id: users.user1._id, type: 'user' },
        { level: 'read', _id: users.user2._id, type: 'user' },
        { level: 'write', _id: users.user3._id, type: 'user' },
        { level: 'read', _id: group1, type: 'group' },
      ],
    },
    {
      title: 'ent4',
      shareId: 'ent4',
      language: 'es',
      published: true,
      permissions: [
        { level: 'write', _id: users.user2._id, type: 'user' },
        { level: 'write', _id: users.user3._id, type: 'user' },
        { level: 'write', _id: group2, type: 'group' },
        { level: 'write', _id: group1, type: 'group' },
      ],
    },
  ],

  users: [
    {
      _id: users.user3._id,
      username: 'group1 user',
    },
  ],
  usergroups: [
    {
      _id: group1,
      name: 'Group1',
      members: [
        {
          _id: users.user3._id,
        },
      ],
    },
  ],
};

export { users, group1, group2 };
