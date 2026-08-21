import { ObjectId } from 'mongodb';

import { UserRole } from '#api/core/domain/user/User.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { PermissionSchema } from '#shared/types/permissionType.js';

const adminId = new ObjectId();
const collaboratorId = new ObjectId();
const collaborator2Id = new ObjectId();
const editorId = new ObjectId();
const softDeletedAdminId = new ObjectId();
const softDeletedCollabId = new ObjectId();
const hardDeletedUserId = new ObjectId();
const groupId = new ObjectId();

const adminGrant: PermissionSchema = { refId: adminId, type: 'user', level: 'write' };
const collaboratorGrant: PermissionSchema = { refId: collaboratorId, type: 'user', level: 'write' };
const collaborator2Grant: PermissionSchema = {
  refId: collaborator2Id,
  type: 'user',
  level: 'write',
};
const editorGrant: PermissionSchema = { refId: editorId, type: 'user', level: 'write' };
const softDeletedAdminGrant: PermissionSchema = {
  refId: softDeletedAdminId,
  type: 'user',
  level: 'write',
};
const softDeletedCollabGrant: PermissionSchema = {
  refId: softDeletedCollabId,
  type: 'user',
  level: 'write',
};
const hardDeletedUserGrant: PermissionSchema = {
  refId: hardDeletedUserId,
  type: 'user',
  level: 'write',
};
const commandIdGrant: PermissionSchema = { refId: 'commandId', type: 'user', level: 'write' };
const groupGrant: PermissionSchema = { refId: groupId, type: 'group', level: 'read' };

const fixtures: DBFixture = {
  users: [
    { _id: adminId, username: 'admin', role: UserRole.ADMIN, email: 'admin@test.com' },
    {
      _id: collaboratorId,
      username: 'collab',
      role: UserRole.COLLABORATOR,
      email: 'collab@test.com',
    },
    {
      _id: collaborator2Id,
      username: 'collab2',
      role: UserRole.COLLABORATOR,
      email: 'collab2@test.com',
    },
    { _id: editorId, username: 'editor', role: UserRole.EDITOR, email: 'editor@test.com' },
    {
      _id: softDeletedAdminId,
      username: 'gone-admin',
      role: UserRole.ADMIN,
      email: 'gone-admin@test.com',
      deletedAt: new Date(),
    },
    {
      _id: softDeletedCollabId,
      username: 'gone-collab',
      role: UserRole.COLLABORATOR,
      email: 'gone-collab@test.com',
      deletedAt: new Date(),
    },
    // hardDeletedUserId is intentionally absent from `users` (hard-deleted).
  ],
  entities: [
    // 1. admin grant stamped on the new copy only -> must be cleared
    { _id: new ObjectId(), sharedId: 'admin-grant', language: 'en', title: 'A en' },
    { _id: new ObjectId(), sharedId: 'admin-grant', language: 'fr', title: 'A fr' },
    {
      _id: new ObjectId(),
      sharedId: 'admin-grant',
      language: 'zh',
      title: 'A zh',
      permissions: [adminGrant],
    },

    // 2. hard-deleted user grant -> must be cleared
    { _id: new ObjectId(), sharedId: 'deleted-user-grant', language: 'en', title: 'B en' },
    {
      _id: new ObjectId(),
      sharedId: 'deleted-user-grant',
      language: 'fr',
      title: 'B fr',
      permissions: [hardDeletedUserGrant],
    },

    // 3. commandId sentinel grant -> must be cleared
    { _id: new ObjectId(), sharedId: 'commandid-grant', language: 'en', title: 'C en' },
    {
      _id: new ObjectId(),
      sharedId: 'commandid-grant',
      language: 'zh',
      title: 'C zh',
      permissions: [commandIdGrant],
    },

    // 4. soft-deleted admin grant -> must be cleared
    { _id: new ObjectId(), sharedId: 'soft-deleted-admin-grant', language: 'en', title: 'D en' },
    {
      _id: new ObjectId(),
      sharedId: 'soft-deleted-admin-grant',
      language: 'zh',
      title: 'D zh',
      permissions: [softDeletedAdminGrant],
    },

    // 5. live non-admin user grant -> must be SKIPPED (left untouched)
    { _id: new ObjectId(), sharedId: 'non-admin-grant', language: 'en', title: 'E en' },
    {
      _id: new ObjectId(),
      sharedId: 'non-admin-grant',
      language: 'zh',
      title: 'E zh',
      permissions: [collaboratorGrant],
    },

    // 6. group grant -> must be SKIPPED (left untouched)
    { _id: new ObjectId(), sharedId: 'group-grant', language: 'en', title: 'F en' },
    {
      _id: new ObjectId(),
      sharedId: 'group-grant',
      language: 'zh',
      title: 'F zh',
      permissions: [groupGrant],
    },

    // 7. consistent admin grant across all copies -> NOT mismatched, left untouched
    {
      _id: new ObjectId(),
      sharedId: 'consistent-admin',
      language: 'en',
      title: 'G en',
      permissions: [adminGrant],
    },
    {
      _id: new ObjectId(),
      sharedId: 'consistent-admin',
      language: 'fr',
      title: 'G fr',
      permissions: [adminGrant],
    },
    {
      _id: new ObjectId(),
      sharedId: 'consistent-admin',
      language: 'zh',
      title: 'G zh',
      permissions: [adminGrant],
    },

    // 8. mixed legit collaborator grant + spurious admin grant -> the admin grant
    //    is pulled, the collaborator grant is kept, and the group becomes consistent
    {
      _id: new ObjectId(),
      sharedId: 'mixed-grants',
      language: 'en',
      title: 'H en',
      permissions: [collaboratorGrant],
    },
    {
      _id: new ObjectId(),
      sharedId: 'mixed-grants',
      language: 'zh',
      title: 'H zh',
      permissions: [collaboratorGrant, adminGrant],
    },

    // 9. mismatched group grant + spurious admin user grant -> the admin user
    //    grant is pulled, the GROUP grant is preserved
    {
      _id: new ObjectId(),
      sharedId: 'mixed-with-group',
      language: 'en',
      title: 'I en',
      permissions: [groupGrant],
    },
    {
      _id: new ObjectId(),
      sharedId: 'mixed-with-group',
      language: 'zh',
      title: 'I zh',
      permissions: [groupGrant, adminGrant],
    },

    // 10. live editor grant -> NOT removed (conservative: only known-bad refs
    //     are pulled; live non-admin grants are left for review)
    { _id: new ObjectId(), sharedId: 'live-editor-grant', language: 'en', title: 'J en' },
    {
      _id: new ObjectId(),
      sharedId: 'live-editor-grant',
      language: 'zh',
      title: 'J zh',
      permissions: [editorGrant],
    },

    // 11. legacy V1 shape: refId stored as a STRING (V1 appendPermissionData
    //     stores user._id.toString()) -> must be cleared via the string match
    { _id: new ObjectId(), sharedId: 'string-refid-grant', language: 'en', title: 'K en' },
    {
      _id: new ObjectId(),
      sharedId: 'string-refid-grant',
      language: 'zh',
      title: 'K zh',
      permissions: [{ refId: adminId.toString(), type: 'user', level: 'write' }],
    },

    // 12. soft-deleted NON-admin (collaborator) grant -> must be cleared (same
    //     deletedAt code path as the soft-deleted admin)
    {
      _id: new ObjectId(),
      sharedId: 'soft-deleted-collab-grant',
      language: 'en',
      title: 'L en',
    },
    {
      _id: new ObjectId(),
      sharedId: 'soft-deleted-collab-grant',
      language: 'zh',
      title: 'L zh',
      permissions: [softDeletedCollabGrant],
    },
  ],
};

// No sharedId appears more than once -> no candidate group, migration is a no-op.
const noMismatchesFixture: DBFixture = {
  users: [{ _id: adminId, username: 'admin', role: UserRole.ADMIN, email: 'admin@test.com' }],
  entities: [
    {
      _id: new ObjectId(),
      sharedId: 'consistent',
      language: 'en',
      title: 'consistent en',
      permissions: [adminGrant],
    },
    {
      _id: new ObjectId(),
      sharedId: 'consistent',
      language: 'fr',
      title: 'consistent fr',
      permissions: [adminGrant],
    },
  ],
};

// Mismatched group whose refs are ALL live non-admin users -> no bad grants to
// remove, migration is a no-op (leaves the divergence for manual review).
const noBadGrantsFixture: DBFixture = {
  users: [
    {
      _id: collaboratorId,
      username: 'collab',
      role: UserRole.COLLABORATOR,
      email: 'collab@test.com',
    },
    {
      _id: collaborator2Id,
      username: 'collab2',
      role: UserRole.COLLABORATOR,
      email: 'collab2@test.com',
    },
  ],
  entities: [
    {
      _id: new ObjectId(),
      sharedId: 'legit-diff',
      language: 'en',
      title: 'legit en',
      permissions: [collaboratorGrant],
    },
    {
      _id: new ObjectId(),
      sharedId: 'legit-diff',
      language: 'zh',
      title: 'legit zh',
      permissions: [collaborator2Grant],
    },
  ],
};

export {
  fixtures,
  noMismatchesFixture,
  noBadGrantsFixture,
  adminId,
  collaboratorId,
  collaborator2Id,
  editorId,
  groupId,
};
