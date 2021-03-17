import { testingDB, DBFixture } from 'api/utils/testing_db';
import { UserSchema } from 'shared/types/userType';
import { ObjectIdSchema } from 'shared/types/commonTypes';

const users: { [key: string]: UserSchema & { _id: ObjectIdSchema } } = {
  user1: {
    _id: testingDB.id(),
    username: 'User 1',
    role: 'collaborator',
    email: 'one@test.com',
  },
  user2: {
    _id: testingDB.id(),
    username: 'User 2',
    role: 'collaborator',
    email: 'two@test.com',
  },
  user3: {
    _id: testingDB.id(),
    username: 'User 3',
    role: 'collaborator',
    email: 'three@test.com',
  },
  adminUser: {
    _id: testingDB.id(),
    username: 'admin',
    role: 'admin',
    email: 'admin@admin.com',
  },
  editorUser: {
    _id: testingDB.id(),
    username: 'editor',
    role: 'editor',
    email: 'editor@editor.com',
  },
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
        { level: 'read', refId: users.user1._id, type: 'user' },
        { level: 'read', refId: group1, type: 'group' },
        { level: 'read', refId: users.editorUser._id, type: 'user' },
      ],
    },
    {
      title: 'ent2',
      shareId: 'ent2',
      language: 'es',
      published: true,
      permissions: [
        { level: 'read', refId: users.user1._id, type: 'user' },
        { level: 'read', refId: group1, type: 'group' },
        { level: 'write', refId: users.adminUser._id, type: 'user' },
      ],
    },
    {
      title: 'ent3',
      shareId: 'ent3',
      language: 'es',
      published: true,
      permissions: [
        { level: 'write', refId: users.user1._id, type: 'user' },
        { level: 'read', refId: users.user2._id, type: 'user' },
        { level: 'write', refId: users.user3._id, type: 'user' },
        { level: 'read', refId: group1, type: 'group' },
        { level: 'read', refId: users.adminUser._id, type: 'user' },
      ],
    },
    {
      title: 'ent3',
      shareId: 'ent3',
      language: 'en',
      published: true,
      permissions: [
        { level: 'write', refId: users.user1._id, type: 'user' },
        { level: 'read', refId: users.user2._id, type: 'user' },
        { level: 'write', refId: users.user3._id, type: 'user' },
        { level: 'read', refId: group1, type: 'group' },
        { level: 'read', refId: users.adminUser._id, type: 'user' },
      ],
    },
    {
      title: 'ent4',
      shareId: 'ent4',
      language: 'es',
      published: true,
      permissions: [
        { level: 'write', refId: users.user2._id, type: 'user' },
        { level: 'write', refId: users.user3._id, type: 'user' },
        { level: 'write', refId: group2, type: 'group' },
        { level: 'write', refId: group1, type: 'group' },
        { level: 'write', refId: users.adminUser._id, type: 'user' },
        { level: 'write', refId: users.editorUser._id, type: 'user' },
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
