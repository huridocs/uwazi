import Immutable from 'immutable';
import { AccessLevels, PermissionType } from '#shared/types/permissionSchema.js';
import { ClientUserSchema } from '#app/apiResponseTypes.js';
import { checkWritePermissions } from '../checkWritePermissions.js';

describe('checkWritePermissions', () => {
  const user: ClientUserSchema = {
    _id: 'user-1',
    role: 'collaborator',
    username: 'collaborator',
    email: 'user@example.com',
    groups: [{ _id: 'group-1', name: 'Group 1' }],
  };

  const userWritePermission = {
    refId: 'user-1',
    type: PermissionType.USER,
    level: AccessLevels.WRITE,
  };

  const groupWritePermission = {
    refId: 'group-1',
    type: PermissionType.GROUP,
    level: AccessLevels.WRITE,
  };

  const otherWritePermission = {
    refId: 'other-user',
    type: PermissionType.USER,
    level: AccessLevels.WRITE,
  };

  describe('plain arrays', () => {
    it('returns true (all) when every entity grants write access via user or group', () => {
      const entities: any[] = [
        { permissions: [userWritePermission] },
        { permissions: [groupWritePermission] },
      ];

      expect(checkWritePermissions(entities, user)).toBe(true);
      expect(checkWritePermissions(entities, user)).toBe(true);
    });

    it('returns true (some) when at least one entity grants write access', () => {
      const entities: any[] = [
        { permissions: [otherWritePermission] },
        { permissions: [userWritePermission] },
      ];

      expect(checkWritePermissions(entities, user, 'some')).toBe(true);
      expect(checkWritePermissions(entities, user, 'all')).toBe(false);
    });

    it('returns false (all) when one entity lacks permissions, true (some) when another grants it', () => {
      const entities: any[] = [{ permissions: [userWritePermission] }, { permissions: undefined }];

      expect(checkWritePermissions(entities, user, 'all')).toBe(false);
      expect(checkWritePermissions(entities, user, 'some')).toBe(true);
    });

    it('returns false when the user has no write permission on any entity', () => {
      expect(checkWritePermissions([{ permissions: [otherWritePermission] }] as any[], user)).toBe(
        false
      );
    });

    it('returns false when there is no user', () => {
      expect(
        checkWritePermissions([{ permissions: [userWritePermission] }] as any[], undefined)
      ).toBe(false);
    });

    it('returns false when there are no entities', () => {
      expect(checkWritePermissions([], user)).toBe(false);
    });
  });

  describe('immutable collections', () => {
    it('returns true (all) when every entity grants write access', () => {
      const entities = Immutable.fromJS([
        { permissions: [userWritePermission] },
        { permissions: [groupWritePermission] },
      ]);

      expect(checkWritePermissions(entities, user, 'all')).toBe(true);
    });

    it('returns true (some) and false (all) when only one entity grants write access', () => {
      const entities = Immutable.fromJS([
        { permissions: [otherWritePermission] },
        { permissions: [userWritePermission] },
      ]);

      expect(checkWritePermissions(entities, user, 'some')).toBe(true);
      expect(checkWritePermissions(entities, user, 'all')).toBe(false);
    });

    it('returns true (some) via group permission', () => {
      const entities = Immutable.fromJS([
        { permissions: [otherWritePermission] },
        { permissions: [groupWritePermission] },
      ]);

      expect(checkWritePermissions(entities, user, 'some')).toBe(true);
    });

    it('returns false when the collection is empty', () => {
      expect(checkWritePermissions(Immutable.fromJS([]), user)).toBe(false);
    });
  });
});
