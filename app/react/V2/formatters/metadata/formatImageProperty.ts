import { Entity } from '#V2/api/entities/types.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { BaseMetadataProperty, ImageMetadataProperty, PreviewMetadataProperty } from '../types';

const isImageType = (type: BaseMetadataProperty['type']) => type === 'image' || type === 'preview';

const formatImageProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata'],
  template?: ClientTemplateSchema
): ImageMetadataProperty | PreviewMetadataProperty | null => {
  if (!isImageType(property.type)) {
    return null;
  }

  const originalProperty = template?.properties?.find(
    templateProperty => templateProperty.name === property.name
  );

  const values = (metadata?.[property.name] ?? [])
    .map(item => item?.value as string | undefined)
    .filter((value): value is string => Boolean(value))
    .map(value => ({ value, alt: value }));

  return {
    _id: property._id,
    name: property.name,
    label: property.label,
    type: property.type === 'preview' ? 'preview' : 'image',
    values,
    style: originalProperty?.fullWidth ? 'cover' : 'contain',
  };
};

export { formatImageProperty };
