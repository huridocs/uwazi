import { UserRole } from '#api/core/domain/user/User.js';
import { testingDB, DBFixture } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';

const f = getFixturesFactory();

const users = {
  user1: {
    _id: testingDB.id(),
    username: 'User 1',
    role: UserRole.COLLABORATOR,
    email: 'one@test.com',
  },
  user2: {
    _id: testingDB.id(),
    username: 'User 2',
    role: UserRole.COLLABORATOR,
    email: 'two@test.com',
  },
  user3: {
    _id: testingDB.id(),
    username: 'User 3',
    role: UserRole.COLLABORATOR,
    email: 'three@test.com',
  },
  adminUser: {
    _id: testingDB.id(),
    username: 'admin',
    role: UserRole.ADMIN,
    email: 'admin@admin.com',
  },
  editorUser: {
    _id: testingDB.id(),
    username: 'editor',
    role: UserRole.EDITOR,
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

  templates: [
    f.template('template1', [], { _id: template1Id }),
    f.template('template2', [], { _id: template2Id }),
    f.template('template3', [], { _id: template3Id }),
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
