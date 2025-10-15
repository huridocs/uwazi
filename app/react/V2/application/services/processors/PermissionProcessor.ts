import { PermissionPropertyTypes, PermissionMetadataProperty } from 'app/V2/domain/entities/types';
import { PermissionSchema } from 'shared/types/permissionType';
import { ProcessingContext, AdapterMetadataProperty, EntityPermissions } from './types';
import { BasePropertyProcessor } from './BasePropertyProcessor';

export class PermissionProcessor extends BasePropertyProcessor {
  readonly name = 'PermissionProcessor';
  readonly propertyTypes: PermissionPropertyTypes[] = ['permissions'];

  protected formatProperty(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): PermissionMetadataProperty['values'] {
    const entityPermissions = this.extractEntityPermissions(property, context);
    return [
      {
        value: entityPermissions,
        label: 'Permissions',
      },
    ];
  }

  private extractEntityPermissions(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): EntityPermissions {
    const permissions = (property.value as PermissionSchema[]) || [];
    const currentUserAccess = this.determineUserAccess(permissions, context);
    const sharedWith = this.extractSharedWith(permissions, context);
    const isPublic = this.isEntityPublic(permissions);
    const isRestricted = this.isEntityRestricted(permissions);

    return {
      refId: property.entity._id || '',
      permissions: sharedWith,
      isPublic,
      isRestricted,
      currentUserAccess,
    };
  }

  private determineUserAccess(
    permissions: PermissionSchema[],
    context: ProcessingContext
  ): 'read' | 'write' | 'admin' | 'none' {
    if (!context.currentUser) {
      return 'none';
    }

    if (context.currentUser.role === 'admin') {
      return 'admin';
    }

    const userPermission = permissions.find(
      p => p.type === 'user' && p.refId === context.currentUser?._id
    );

    if (userPermission) {
      return userPermission.level === 'write' ? 'write' : 'read';
    }

    const groupPermissions = (context.currentUser.groups || [])
      .map(groupId => permissions.find(p => p.type === 'group' && p.refId === groupId._id))
      .filter(Boolean);

    if (groupPermissions.length > 0) {
      return groupPermissions[0]?.level === 'write' ? 'write' : 'read';
    }

    return 'none';
  }

  private extractSharedWith(permissions: PermissionSchema[], _context: ProcessingContext) {
    return permissions.map(permission => ({
      type: permission.type as 'user' | 'group',
      refId: permission.refId as string,
      level: permission.level,
    }));
  }

  private isEntityPublic(permissions: PermissionSchema[]): boolean {
    return permissions.length === 0 || permissions.some(p => p.type === 'public');
  }

  private isEntityRestricted(permissions: PermissionSchema[]): boolean {
    return permissions.some(p => p.type === 'user' || p.type === 'group');
  }
}
