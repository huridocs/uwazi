import { Entity } from '#V2/api/entities/types.js';
import {
  BaseMetadataProperty,
  MultiSelectMetadataProperty,
  SelectMetadataProperty,
} from '../types';
import {
  resolvePropertyMetadataValues,
  resolvePropertyType,
} from './resolvePropertyMetadataValues.js';

const isSelectType = (type: BaseMetadataProperty['type']) =>
  type === 'select' || type === 'multiselect';

const formatSelectProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): SelectMetadataProperty | MultiSelectMetadataProperty | null => {
  const metadataValues = resolvePropertyMetadataValues(property, metadata);
  const type = resolvePropertyType(property, metadata);

  if (!isSelectType(type)) {
    return null;
  }

  const values = metadataValues.map(value => {
    const { parent } = value;
    return {
      value: (value.value as string) || '',
      label: value.label || '',
      ...(parent && {
        parent: { value: (parent?.value as string) || '', label: parent?.label || '' },
      }),
    };
  });

  return {
    _id: property._id,
    name: property.name,
    label: property.label,
    type,
    values,
    inherited: property.inherited,
    inheritedType: property.inheritedType,
  };
};

export { formatSelectProperty };
