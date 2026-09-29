import { Entity } from '#V2/api/entities/types.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { BaseMetadataProperty, ImageMetadataProperty, PreviewMetadataProperty } from '../types';
import {
  resolvePropertyMetadataValues,
  resolvePropertyType,
} from './resolvePropertyMetadataValues.js';

type ImageFit = 'contain' | 'cover';

type ImageFormatSource = {
  template?: ClientTemplateSchema;
  entity?: Entity;
};

const isImageType = (type: BaseMetadataProperty['type']) => type === 'image' || type === 'preview';

const imageLayoutFromTemplate = (
  property: BaseMetadataProperty,
  template?: ClientTemplateSchema
): { style: ImageFit; fullWidth: boolean } => {
  const original = template?.properties?.find(
    templateProperty => templateProperty.name === property.name
  );
  const style = original?.style ?? property.style;
  return {
    style: style === 'contain' ? 'contain' : 'cover',
    fullWidth: Boolean(original?.fullWidth ?? property.fullWidth),
  };
};

const previewUrlFromEntity = (entity?: Entity): string | undefined => {
  const preview = entity?.preview;
  return typeof preview === 'string' && preview ? `/api/files/${preview}` : undefined;
};

const formatImageProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata'],
  source?: ImageFormatSource
): ImageMetadataProperty | PreviewMetadataProperty | null => {
  const metadataValues = resolvePropertyMetadataValues(property, metadata);
  const type = resolvePropertyType(property, metadata);

  if (!isImageType(type)) {
    return null;
  }

  const { style, fullWidth } = imageLayoutFromTemplate(property, source?.template);

  const metadataUrls = metadataValues
    .map(item => item?.value as string | undefined)
    .filter((value): value is string => Boolean(value));

  const previewUrl =
    type === 'preview' && metadataUrls.length === 0
      ? previewUrlFromEntity(source?.entity)
      : undefined;
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
    style,
    fullWidth,
  };
};

export { formatImageProperty, imageLayoutFromTemplate };
