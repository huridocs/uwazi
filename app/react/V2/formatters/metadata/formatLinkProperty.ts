import type { Entity } from '#V2/api/entities/types.js';
import type { BaseMetadataProperty, LinkMetadataProperty } from '../types';

const isLinkType = (type: BaseMetadataProperty['type']) => type === 'link';

const formatLinkProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): LinkMetadataProperty | null => {
  if (!isLinkType(property.type)) {
    return null;
  }

  const link = metadata?.[property.name]?.[0]?.value as
    | { url?: string; label?: string }
    | undefined;

  return {
    _id: property._id,
    name: property.name,
    type: property.type,
    values: link ? [{ value: link.url ?? '', label: link.label ?? '' }] : [],
    label: property.label,
    inherited: property.inherited,
    inheritedType: property.inheritedType,
  };
};

export { formatLinkProperty };
