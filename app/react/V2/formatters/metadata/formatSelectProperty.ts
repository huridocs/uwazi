import { Entity } from '#app/V2/api/entities/types.js';
import {
  BaseMetadataProperty,
  MultiSelectMetadataProperty,
  SelectMetadataProperty,
} from '../types';

const isSelectType = (type: BaseMetadataProperty['type']) =>
  type === 'select' || type === 'multiselect';

const formatSelectProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): SelectMetadataProperty | MultiSelectMetadataProperty | null => {
  if (!isSelectType(property.type)) {
    return null;
  }

  const metadataValues = metadata?.[property.name] ?? [];

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
    type: property.type,
    values,
  };
};

export { formatSelectProperty };
