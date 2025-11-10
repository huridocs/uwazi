/* eslint-disable no-new */
import { EntityPermission } from '../EntityPermission';
import { AccessLevel } from '../AccessLevel';
import { PermissionType } from '../PermissionType';

describe('EntityPermission', () => {
  it('should create an instance with no access grants by default', () => {
    const permission = new EntityPermission();
    expect(permission.accessGrants).toEqual([]);
  });

  it('should create an instance with valid access grants', () => {
    const permission = new EntityPermission([
      { refId: 'user123', type: PermissionType.User, level: AccessLevel.Read },
      { refId: 'group456', type: PermissionType.Group, level: AccessLevel.Write },
    ]);

    expect(permission.accessGrants).toHaveLength(2);
    expect(permission.accessGrants[0]).toEqual({
      refId: 'user123',
      type: PermissionType.User,
      level: AccessLevel.Read,
    });
  });

  it('should throw error when refId is empty', () => {
    expect(() => {
      new EntityPermission([{ refId: '', type: PermissionType.User, level: AccessLevel.Read }]);
    }).toThrow('refId cannot be empty');
  });

  it('should throw error when type is invalid', () => {
    expect(() => {
      new EntityPermission([{ refId: 'user123', type: 'invalid' as any, level: AccessLevel.Read }]);
    }).toThrow("Invalid enum value. Expected 'user' | 'group' | 'public'");
  });

  it('should throw error when level is invalid', () => {
    expect(() => {
      new EntityPermission([
        { refId: 'user123', type: PermissionType.User, level: 'invalid' as any },
      ]);
    }).toThrow("Invalid enum value. Expected 'read' | 'write' | 'mixed'");
  });

  it('should throw error when duplicate user grants exist', () => {
    expect(() => {
      new EntityPermission([
        { refId: 'user123', type: PermissionType.User, level: AccessLevel.Read },
        { refId: 'user123', type: PermissionType.User, level: AccessLevel.Write },
      ]);
    }).toThrow('Permissions should be unique by person/group');
  });

  it('should reject duplicate refIds even with different types', () => {
    expect(() => {
      new EntityPermission([
        { refId: 'abc123', type: PermissionType.User, level: AccessLevel.Read },
        { refId: 'abc123', type: PermissionType.Group, level: AccessLevel.Write },
      ]);
    }).toThrow('Permissions should be unique by person/group');
  });
});
