import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty, SimpleMetadataProperty } from '../types.js';

const isSimpleType = (type: BaseMetadataProperty['type']) =>
  type === 'text' || type === 'generatedid' || type === 'numeric' || type === 'markdown';

const formatSimpleProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): SimpleMetadataProperty | null => {
  if (!isSimpleType(property.type)) {
    return null;
  }

  const rawValues = metadata?.[property.name] ?? [];
  const values =
    rawValues.length > 0
      ? rawValues.map(item => {
          const value = item?.value;
          return {
            value: value === null || value === undefined ? '' : String(value),
          };
        })
      : [{ value: '' }];

  return {
    _id: property._id,
    name: property.name,
    type: property.type,
    values,
    label: property.label,
    inherited: property.inherited,
    inheritedType: property.inheritedType,
  };
};

export { formatSimpleProperty };
