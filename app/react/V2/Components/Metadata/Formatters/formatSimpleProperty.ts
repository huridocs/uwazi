import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty, SimpleMetadataProperty } from '../MetadataPropertiesType.js';

const isSimpleType = (type: BaseMetadataProperty['type']) =>
  type === 'text' || type === 'generatedid' || type === 'numeric';

const formatSimpleProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): SimpleMetadataProperty | null => {
  if (!isSimpleType(property.type)) {
    return null;
  }

  const rawValue = metadata?.[property.name]?.[0]?.value;
  const value = rawValue === null || rawValue === undefined ? '' : String(rawValue);

  return {
    _id: property._id,
    name: property.name,
    type: property.type,
    values: [{ value }],
    label: property.label,
    inherited: property.inherited,
    inheritedType: property.inheritedType,
  };
};

export { formatSimpleProperty };
