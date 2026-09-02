import { Entity } from '#V2/api/entities/types.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { BaseMetadataProperty, ImageMetadataProperty, PreviewMetadataProperty } from '../types';
import {
  resolvePropertyMetadataValues,
  resolvePropertyType,
} from './resolvePropertyMetadataValues.js';

const isImageType = (type: BaseMetadataProperty['type']) => type === 'image' || type === 'preview';

const previewUrlFromEntity = (entity?: Entity): string | undefined => {
  const preview = entity?.preview;
  return typeof preview === 'string' && preview ? `/api/files/${preview}` : undefined;
};

const formatImageProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata'],
  template?: ClientTemplateSchema,
  entity?: Entity
): ImageMetadataProperty | PreviewMetadataProperty | null => {
  const metadataValues = resolvePropertyMetadataValues(property, metadata);
  const type = resolvePropertyType(property, metadata);

  if (!isImageType(type)) {
    return null;
  }

  const originalProperty = template?.properties?.find(
    templateProperty => templateProperty.name === property.name
  );

  const metadataUrls = metadataValues
    .map(item => item?.value as string | undefined)
    .filter((value): value is string => Boolean(value));

  const previewUrl =
    type === 'preview' && metadataUrls.length === 0 ? previewUrlFromEntity(entity) : undefined;
  const urls = previewUrl ? [previewUrl, ...metadataUrls] : metadataUrls;

  const values = urls.map(value => ({
    value,
    alt: type === 'preview' ? property.label : value,
  }));

  return {
    _id: property._id,
    name: property.name,
    label: property.label,
    type: type === 'preview' ? 'preview' : 'image',
    values,
    style: originalProperty?.fullWidth ? 'cover' : 'contain',
  };
};

export { formatImageProperty };
