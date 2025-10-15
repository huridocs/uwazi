import { PermissionPropertyTypes } from 'app/V2/domain/entities/types';
import { MetadataProperty } from 'app/V2/domain/entities/types';
import { PermissionSchema } from 'shared/types/permissionType';
import {
  PropertyTypeProcessor,
  ProcessingContext,
  AdapterMetadataProperty,
  EntityPermissions,
} from './types';

export class PermissionProcessor implements PropertyTypeProcessor {
  readonly name = 'PermissionProcessor';
  readonly propertyTypes: PermissionPropertyTypes[] = ['permissions'];


  protected formatProperty(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): MetadataProperty {
    const entityPermissions = this.extractEntityPermissions(property, context);

    const formattedProperty: AdapterMetadataProperty = {
      _id: property._id,
      _entityId: property._entityId,
      type: property.type,
      name: property.name,
      label: property.label,
      translatedLabel: property.translatedLabel,
      values: [
        {
          value: entityPermissions as any,
          label: 'Permissions',
        },
      ],
      value: property.value || null,
      inherited: property.inherited || false,
      inheritedType: property.inheritedType,
      properties: {
        _id: property._id,
        inherited: property.inherited || false,
        template: property.properties?.template ? {
          _id: property.properties.template._id,
          name: property.properties.template.name,
          label: (property.properties.template as any).label || property.properties.template.name,
          color: property.properties.template.color || '',
        } : undefined,
        inheritedProperty: property.properties?.inheritedProperty ? {
          property: property.properties.inheritedProperty.name || '',
          type: (property.properties.inheritedProperty.type || 'permissions') as any,
          name: property.properties.inheritedProperty.name || '',
          label: property.properties.inheritedProperty.label || '',
        } : undefined,
        translationContext: property.properties.translationContext
      },
    };

    return formattedProperty;
  }

  private extractEntityPermissions(property: AdapterMetadataProperty, context: ProcessingContext): EntityPermissions {
    const permissions = (property.value as PermissionSchema[]) || [];
    const currentUserAccess = this.determineUserAccess(permissions, context);
    const sharedWith = this.extractSharedWith(permissions, context);
    const isPublic = this.isEntityPublic(permissions);
    const isRestricted = this.isEntityRestricted(permissions);

    return {
      refId: property._entityId || '',
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
