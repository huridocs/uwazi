import type { Entity } from '#V2/api/entities/types.js';
import type { BaseMetadataProperty, LinkMetadataProperty } from '../types';
import {
  resolvePropertyMetadataValues,
  resolvePropertyType,
} from './resolvePropertyMetadataValues.js';

const isLinkType = (type: BaseMetadataProperty['type']) => type === 'link';

const formatLinkProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): LinkMetadataProperty | null => {
  const metadataValues = resolvePropertyMetadataValues(property, metadata);
  const type = resolvePropertyType(property, metadata);

  if (!isLinkType(type)) {
    return null;
  }

  const values = metadataValues.map(item => {
    const link = item?.value as { url?: string; label?: string } | undefined;
    return {
      value: link?.url ?? '',
      label: link?.label ?? '',
    };
  });

  return {
    _id: property._id,
    name: property.name,
    type: 'link',
    values,
    label: property.label,
    inherited: property.inherited,
    inheritedType: property.inheritedType,
  };
};

export { formatLinkProperty };
