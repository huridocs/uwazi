import type { Entity, MetadataObjectSchema } from '#V2/api/entities/types.js';
import type {
  BaseMetadataProperty,
  MetadataValue,
  RelationshipMetadataProperty,
} from '../types.js';
import {
  resolvePropertyMetadataValues,
  resolvePropertyType,
} from './resolvePropertyMetadataValues.js';

const TYPE_NAMES = new Set(['entity', 'document', 'relationship', 'newRelationship']);

const readOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined;

const templateIdBySharedId = (
  relations: Entity['relations'] | undefined
): ReadonlyMap<string, string> => {
  const map = new Map<string, string>();
  relations?.forEach(relation => {
    const sharedId = relation.entity;
    const templateId = relation.entityData?.template;
    if (sharedId && templateId) {
      map.set(sharedId, templateId);
    }
  });
  return map;
};

const readRelationshipIcon = (
  icon: unknown
): { _id: string; label?: string; type?: string } | undefined => {
  if (!icon || typeof icon !== 'object') {
    return undefined;
  }
  if (!('_id' in icon)) {
    return undefined;
  }
  const id = icon._id;
  if (typeof id !== 'string' || !id) {
    return undefined;
  }
  const label = 'label' in icon ? readOptionalString(icon.label) : undefined;
  const type = 'type' in icon ? readOptionalString(icon.type) : undefined;
  return {
    _id: id,
    ...(label !== undefined && { label }),
    ...(type !== undefined && { type }),
  };
};

const templateIdFromType = (type: string | undefined): string | undefined =>
  type && !TYPE_NAMES.has(type) ? type : undefined;

const mapRelationshipValue = (
  metadataValue: MetadataValue,
  templateIds: ReadonlyMap<string, string>
) => {
  const icon = readRelationshipIcon(metadataValue.icon);
  const sharedId = String(metadataValue.value || '');
  const templateId =
    templateIds.get(sharedId) || templateIdFromType(readOptionalString(metadataValue.type));

  return {
    _id: sharedId,
    title: metadataValue.label || '',
    ...(templateId && { templateId }),
    ...(metadataValue.authorized === false && { authorized: false as const }),
    ...(icon && { icon }),
  };
};

const isRelationshipLike = (t: BaseMetadataProperty['type']) =>
  t === 'relationship' || t === 'newRelationship';

const toFormatterMetadataValue = (item: MetadataObjectSchema): MetadataValue => {
  const type = readOptionalString(item.type);
  const authorized = item.authorized === false ? (false as const) : undefined;
  return {
    value: item.value,
    label: item.label,
    parent: item.parent,
    ...(type !== undefined && { type }),
    ...(authorized !== undefined && { authorized }),
    icon: item.icon,
  };
};

const resolveLinkMetadataValues = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): MetadataValue[] => {
  const values = metadata?.[property.name];
  if (!values?.length) {
    return [];
  }
  return values.map(toFormatterMetadataValue);
};

const toRelationshipProperty = (
  property: BaseMetadataProperty,
  values: MetadataValue[],
  templateIds: ReadonlyMap<string, string>
): RelationshipMetadataProperty => ({
  _id: property._id,
  name: property.name,
  label: property.label,
  type: 'relationship',
  mode: 'related',
  values: values.map(value => mapRelationshipValue(value, templateIds)),
  inherited: property.inherited,
  inheritedType: property.inheritedType,
  ...(property.relationShipTarget && { relationShipTarget: property.relationShipTarget }),
});

const formatRelationshipLinks = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata'],
  relations?: Entity['relations']
): RelationshipMetadataProperty | null => {
  if (!isRelationshipLike(property.type)) {
    return null;
  }
  return toRelationshipProperty(
    property,
    resolveLinkMetadataValues(property, metadata),
    templateIdBySharedId(relations)
  );
};

const formatRelationshipProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata'],
  relations?: Entity['relations']
): RelationshipMetadataProperty | null => {
  if (!isRelationshipLike(property.type)) {
    return null;
  }

  const resolvedValues = resolvePropertyMetadataValues(property, metadata);
  const type = resolvePropertyType(property, metadata);

  if (property.inherited && !isRelationshipLike(type)) {
    return null;
  }

  return toRelationshipProperty(property, resolvedValues, templateIdBySharedId(relations));
};

export { formatRelationshipProperty, formatRelationshipLinks };
