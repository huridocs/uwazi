import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty, SimpleMetadataProperty } from '../types.js';
import {
  resolvePropertyMetadataValues,
  resolvePropertyType,
} from './resolvePropertyMetadataValues.js';

const isSimpleType = (type: BaseMetadataProperty['type']) =>
  type === 'text' || type === 'generatedid' || type === 'numeric' || type === 'markdown';

const formatSimpleProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): SimpleMetadataProperty | null => {
  const metadataValues = resolvePropertyMetadataValues(property, metadata);
  const type = resolvePropertyType(property, metadata);

  if (!isSimpleType(type)) {
    return null;
  }

  const values =
    metadataValues.length > 0
      ? metadataValues.map(item => {
          const value = item?.value;
          return {
            value: value === null || value === undefined ? '' : String(value),
          };
        })
      : [{ value: '' }];

  return {
    _id: property._id,
    name: property.name,
    type,
    values,
    label: property.label,
    inherited: property.inherited,
    inheritedType: property.inheritedType,
  };
};

export { formatSimpleProperty };
