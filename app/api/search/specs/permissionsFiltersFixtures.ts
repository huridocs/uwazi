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
const template1Id = testingDB.id();
const template2Id = testingDB.id();
const template3Id = testingDB.id();

export const permissionsLevelFixtures: DBFixture = {
  entities: [
    {
      title: 'ent1',
      shareId: 'ent1',
      language: 'es',
      published: false,
      template: template1Id,
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
      published: false,
      template: template2Id,
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
      published: false,
      template: template1Id,
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
      published: false,
      template: template1Id,
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
      published: false,
      template: template3Id,
      permissions: [
        { level: 'write', refId: users.user2._id, type: 'user' },
        { level: 'write', refId: users.user3._id, type: 'user' },
        { level: 'write', refId: group1, type: 'group' },
        { level: 'write', refId: users.adminUser._id, type: 'user' },
        { level: 'write', refId: users.editorUser._id, type: 'user' },
      ],
    },
    {
      title: 'entPublic1',
      shareId: 'ent_public1',
      language: 'es',
      published: true,
      template: template1Id,
      permissions: [{ level: 'write', refId: users.user2._id, type: 'user' }],
    },
    {
      title: 'entPublic2',
      shareId: 'ent_public2',
      language: 'es',
      published: true,
      template: template3Id,
      permissions: [{ level: 'write', refId: users.user3._id, type: 'user' }],
    },
  ],

  users: Object.values(users),
  usergroups: [
    {
      _id: group1,
      name: 'Group1',
      members: [
        {
          refId: users.user3._id,
        },
      ],
    },
  ],
};

export { users, group1, template1Id, template2Id, template3Id };
