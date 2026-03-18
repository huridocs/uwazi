import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { UserRole } from '#shared/types/userSchema.js';
import { UserSchema } from '#shared/types/userType.js';

export const factory = getFixturesFactory();

export const tenantId = 'test_tenant_authorized_search';
export const elasticTestIndex = 'authorized_entity_test';

export const publishedEntityId = 'published_entity';
export const restrictedToCollaboratorEntityId = 'restricted_collaborator_entity';
export const restrictedToGroupEntityId = 'restricted_group_entity';
export const restrictedToOtherUserEntityId = 'restricted_other_user_entity';
export const adminOnlyEntityId = 'admin_only_entity';

export const users: UserSchema[] = [
  factory.user('admin', UserRole.ADMIN, 'admin@test.com', 'hash'),
  factory.user('editor', UserRole.EDITOR, 'editor@test.com', 'hash'),
  {
    ...factory.user('collaborator', UserRole.COLLABORATOR, 'collaborator@test.com', 'hash'),
    groups: [{ _id: factory.id('groupA'), name: 'Group A' }],
  },
  factory.user('collaborator2', UserRole.COLLABORATOR, 'collaborator2@test.com', 'hash'),
];

export const elasticEntities = [
  {
    _id: publishedEntityId,
    sharedId: publishedEntityId,
    title: 'Published Entity',
    published: true,
    permissionRefIds: [],
    tenantId,
  },
  {
    _id: restrictedToCollaboratorEntityId,
    sharedId: restrictedToCollaboratorEntityId,
    title: 'Restricted to Collaborator',
    published: false,
    permissionRefIds: [factory.id('collaborator').toString()],
    tenantId,
  },
  {
    _id: restrictedToGroupEntityId,
    sharedId: restrictedToGroupEntityId,
    title: 'Restricted to Group',
    published: false,
    permissionRefIds: [factory.id('groupA').toString()],
    tenantId,
  },
  {
    _id: restrictedToOtherUserEntityId,
    sharedId: restrictedToOtherUserEntityId,
    title: 'Restricted to Other User',
    published: false,
    permissionRefIds: [factory.id('collaborator2').toString()],
    tenantId,
  },
  {
    _id: adminOnlyEntityId,
    sharedId: adminOnlyEntityId,
    title: 'Admin Only Entity',
    published: false,
    permissionRefIds: [],
    tenantId,
  },
];

export const getUserById = (userId: ObjectId): UserSchema | null =>
  users.find(u => u._id?.toString() === userId.toString()) || null;
