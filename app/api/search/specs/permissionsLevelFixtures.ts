import { testingDB, DBFixture } from 'api/utils/testing_db';

const user1 = testingDB.id();
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
        { level: 'read', _id: 'User1', type: 'user' },
        { level: 'read', _id: group1, type: 'user' }
      ],
    },
    {
      title: 'ent2',
      shareId: 'ent2',
      language: 'es',
      published: true,
      permissions: [
        { level: 'read', _id: 'User1', type: 'user' },
        { level: 'read', _id: group1, type: 'user' }
      ],
    },
    {
      title: 'ent3',
      shareId: 'ent3',
      language: 'es',
      published: true,
      permissions: [
        { level: 'write', _id: 'User1', type: 'user' },
        { level: 'write', _id: group1, type: 'user' },
        { level: 'read', _id: 'User2', type: 'user' },
      ],
    },
    {
      title: 'ent3',
      shareId: 'ent3',
      language: 'en',
      published: true,
      permissions: [
        { level: 'write', _id: 'User1', type: 'user' },
        { level: 'write', _id: user1, type: 'user' },
        { level: 'write', _id: group1, type: 'user' },
        { level: 'read', _id: 'User2', type: 'user' },
      ],
    },
    {
      title: 'ent4',
      shareId: 'ent4',
      language: 'es',
      published: true,
      permissions: [
        { level: 'write', _id: group2, type: 'user' },
        { level: 'write', _id: user1, type: 'user' },
        { level: 'write', _id: group1, type: 'user' },
      ],
    },
  ],

  users: [
    {
      _id: user1,
      username: 'group1 user'
    }
  ],
  usergroups: [
    {
      _id: group1,
      name: 'Group1',
      members: [{
        _id: user1,
      }]
    }
  ]
};

export { user1, group1, group2 };
