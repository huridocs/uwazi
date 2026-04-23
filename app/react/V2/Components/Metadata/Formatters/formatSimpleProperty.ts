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

  const value = metadata?.[property.name]?.[0]?.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return {
    _id: property._id,
    name: property.name,
    type: property.type,
    values: [{ value: String(value) }],
    label: property.label,
    inherited: property.inherited,
    inheritedType: property.inheritedType,
  };
};

export { formatSimpleProperty };
