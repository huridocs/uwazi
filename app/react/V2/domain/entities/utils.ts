import { Entity } from './Entity';

export const EntityUtils = {
  isValid: (entity: Entity): boolean => !!(entity._id && entity.sharedId),
  hasMetadata: (entity: Entity): boolean => Object.keys(entity.metadata || {}).length > 0,
};

export const EntityFactory = {
  fromRawEntity: (rawEntity: any, options: any): Entity => {
    return {
      _id: rawEntity._id || rawEntity.id,
      sharedId: rawEntity.sharedId,
      title: rawEntity.title,
      language: rawEntity.language,
      template: options.includeTemplate ? rawEntity.template : undefined,
      creationDate: rawEntity.creationDate,
      editDate: rawEntity.editDate,
      icon: rawEntity.icon,
      permissions: options.includePermissions ? rawEntity.permissions : undefined,
      metadata: options.includeMetadata ? rawEntity.metadata : undefined,
      relationships: options.includeRelationships ? rawEntity.relationships : undefined,
      files: options.includeFiles ? rawEntity.files : undefined,
      navigation: options.includeNavigation ? rawEntity.navigation : undefined,
      rawEntity: rawEntity,
    };
  },
};
