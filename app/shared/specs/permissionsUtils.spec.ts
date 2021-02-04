import { UserSchema } from '../types/userType';
import { PermissionSchema } from '../types/permissionType';
import { checkWritePermissions } from '../permissionsUtils';

describe('Permissions utils', () => {
  describe('checkWritePermissions', () => {
    it('should return TRUE if the user has WRITE permissions in the permissions set', () => {
      const user: UserSchema = {
        username: 'someuser',
        _id: 'someuser',
        email: 'someuser@example.com',
        role: 'collaborator',
      };

      const permissions: PermissionSchema[] = [
        {
          _id: 'someuser',
          type: 'user',
          level: 'write',
        },
        {
          _id: 'someotheruser',
          type: 'user',
          level: 'read',
        },
      ];

      expect(checkWritePermissions(user, permissions)).toBe(true);
    });

    it('should return FALSE if the user has READ permissions in the permissions set', () => {
      const user: UserSchema = {
        username: 'someuser',
        _id: 'someuser',
        email: 'someuser@example.com',
        role: 'collaborator',
      };

      const permissions: PermissionSchema[] = [
        {
          _id: 'someuser',
          type: 'user',
          level: 'read',
        },
        {
          _id: 'someotheruser',
          type: 'user',
          level: 'write',
        },
      ];

      expect(checkWritePermissions(user, permissions)).toBe(false);
    });

    it('should return FALSE if the user has NO permissions in the permissions set', () => {
      const user: UserSchema = {
        username: 'someuser',
        _id: 'someuser',
        email: 'someuser@example.com',
        role: 'collaborator',
      };

      const permissions: PermissionSchema[] = [
        {
          _id: 'someotheruser',
          type: 'user',
          level: 'write',
        },
      ];

      expect(checkWritePermissions(user, permissions)).toBe(false);
    });

    it('should return TRUE if the user belongs to a group that has WRITE permissions in the set', () => {
      const user: UserSchema = {
        username: 'someuser',
        _id: 'someuser',
        email: 'someuser@example.com',
        role: 'collaborator',
        groups: [
          {
            _id: 'somegroup',
            name: 'somegroup',
          },
        ],
      };

      const permissions: PermissionSchema[] = [
        {
          _id: 'someuser',
          type: 'user',
          level: 'read',
        },
        {
          _id: 'somegroup',
          type: 'group',
          level: 'write',
        },
        {
          _id: 'someotheruser',
          type: 'user',
          level: 'read',
        },
      ];

      expect(checkWritePermissions(user, permissions)).toBe(true);
    });

    it('should return FALSE if no user provided', () => {
      expect(
        checkWritePermissions(undefined, [
          {
            _id: 'someuser',
            type: 'user',
            level: 'read',
          },
        ])
      ).toBe(false);
    });

    it('should return FALSE if no permissions provided', () => {
      expect(
        checkWritePermissions(
          {
            username: 'someuser',
            _id: 'someuser',
            email: 'someuser@example.com',
            role: 'collaborator',
          },
          undefined
        )
      ).toBe(false);
    });
  });
});
