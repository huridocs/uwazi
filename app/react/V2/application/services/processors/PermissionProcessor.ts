import { ComposedProperty, PermissionPropertyTypes } from 'app/V2/domain/entities/types';
import { PermissionSchema } from 'shared/types/permissionType';
import {
  PropertyTypeProcessor,
  ProcessingContext,
  FormattedProperty,
  EntityPermissions,
} from './types';

export class PermissionProcessor implements PropertyTypeProcessor {
  readonly name = 'PermissionProcessor';
  readonly propertyTypes: PermissionPropertyTypes[] = ['permissions'];

  processBatch(
    properties: ComposedProperty[],
    context: ProcessingContext,
    _processors?: Map<string, PropertyTypeProcessor>
  ): Map<string, FormattedProperty> {
    const results = new Map<string, FormattedProperty>();

    properties.forEach(property => {
      const formattedProperty = this.processPermissionProperty(property, context);
      results.set(property.name, formattedProperty);
    });

    return results;
  }

  private processPermissionProperty(
    property: ComposedProperty,
    context: ProcessingContext
  ): FormattedProperty {
    const entityPermissions = this.extractEntityPermissions(property, context);

    const formattedProperty: FormattedProperty = {
      values: [
        {
          value: entityPermissions,
          label: 'Permissions',
          displayValue: this.formatPermissionsDisplay(entityPermissions),
          formattedValue: entityPermissions,
        },
      ],
      label: property.label || 'Permissions',
      name: property.name,
      propertyMetadata: {
        showInCard: false,
        propertyType: 'permissions',
        isInherited: false,
        isRequired: false,
        isMultiple: false,
        noLabel: false,
        fullWidth: false,
        obsolete: false,
      },
      type: 'permissions',
      originalValue: property.value,
    };

    return formattedProperty;
  }

  private extractEntityPermissions(property: any, context: ProcessingContext): EntityPermissions {
    const permissions = property.value || [];
    const currentUserAccess = this.determineUserAccess(permissions, context);
    const sharedWith = this.extractSharedWith(permissions, context);
    const isPublic = this.isEntityPublic(permissions);
    const isRestricted = this.isEntityRestricted(permissions);

    return {
      refId: property.refId || property._entityId || '',
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

  private formatPermissionsDisplay(permissions: EntityPermissions): string {
    if (permissions.isPublic) {
      return 'Public';
    }

    if (permissions.isRestricted) {
      const sharedCount = permissions.permissions.length;
      return `Shared with ${sharedCount} ${sharedCount === 1 ? 'person' : 'people'}`;
    }

    return 'Private';
  }
}
