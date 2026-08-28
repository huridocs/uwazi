import type { MetadataValue, RelatedRelationshipMetadataProperty } from '../types.js';

type RelationshipEntityValue = RelatedRelationshipMetadataProperty['values'][number];

type RelationshipEntityMappingOptions = {
  defaultTemplateId?: string;
  templateIds?: ReadonlyMap<string, string>;
  titleFallback?: 'sharedId' | 'empty';
};

const RELATIONSHIP_VALUE_TYPES = new Set(['entity', 'document', 'relationship', 'newRelationship']);

const readOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined;

const readRelationshipIcon = (icon: unknown): RelationshipEntityValue['icon'] | undefined => {
  if (!icon || typeof icon !== 'object' || !('_id' in icon)) return undefined;
  const id = icon._id;
  if (typeof id !== 'string' || !id) return undefined;
  const label = 'label' in icon ? readOptionalString(icon.label) : undefined;
  const type = 'type' in icon ? readOptionalString(icon.type) : undefined;
  return {
    _id: id,
    ...(label !== undefined && { label }),
    ...(type !== undefined && { type }),
  };
};

const templateIdFromType = (type: string | undefined): string | undefined =>
  type && !RELATIONSHIP_VALUE_TYPES.has(type) ? type : undefined;

const templateIdForItem = (
  item: MetadataValue,
  sharedId: string,
  options: RelationshipEntityMappingOptions
): string | undefined =>
  options.templateIds?.get(sharedId) ||
  templateIdFromType(readOptionalString(item.type)) ||
  options.defaultTemplateId;

const relationshipEntityValueFromMetadata = (
  item: MetadataValue,
  options: RelationshipEntityMappingOptions = {}
): RelationshipEntityValue | undefined => {
  if (typeof item.value !== 'string' || !item.value) return undefined;
  const sharedId = item.value;
  let title = sharedId;
  if (typeof item.label === 'string' && item.label.length > 0) {
    title = item.label;
  } else if (options.titleFallback === 'empty') {
    title = '';
  }
  const templateId = templateIdForItem(item, sharedId, options);
  const icon = readRelationshipIcon(item.icon);
  return {
    _id: sharedId,
    title,
    ...(templateId ? { templateId } : {}),
    ...(item.authorized === false ? { authorized: false as const } : {}),
    ...(icon ? { icon } : {}),
  };
};

const relationshipEntityValuesFromMetadata = (
  items: MetadataValue[],
  options: RelationshipEntityMappingOptions = { titleFallback: 'sharedId' }
): RelationshipEntityValue[] =>
  items.flatMap(item => {
    const value = relationshipEntityValueFromMetadata(item, options);
    return value ? [value] : [];
  });

export { relationshipEntityValueFromMetadata, relationshipEntityValuesFromMetadata };
export type { RelationshipEntityMappingOptions, RelationshipEntityValue };
