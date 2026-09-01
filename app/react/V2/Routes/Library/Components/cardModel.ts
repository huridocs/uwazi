import type { Template } from '#app/apiResponseTypes.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import type { EntityCardField } from './EntityCard.js';
import type { ThumbnailKind } from './EntityThumbnail.js';

const SKIPPED_PROPERTY_TYPES = new Set([
  'relationship',
  'geolocation',
  'preview',
  'image',
  'media',
  'nested',
  'link',
]);

const metadataFieldsForCard = (entity: Entity, template?: Template): EntityCardField[] => {
  const properties = template?.properties ?? [];
  const fields: EntityCardField[] = [];

  properties.forEach(property => {
    if (fields.length >= 3 || SKIPPED_PROPERTY_TYPES.has(property.type)) {
      return;
    }
    const values = entity.metadata?.[property.name];
    if (!values?.length) {
      return;
    }
    const display = values
      .map(value => value.label ?? (value.value !== undefined ? String(value.value) : ''))
      .filter(Boolean)
      .join(', ');
    if (!display) {
      return;
    }
    fields.push({ id: property.name, label: property.label, value: display });
  });

  return fields;
};

const fileKind = (file?: FileType): ThumbnailKind | undefined => {
  if (!file) {
    return undefined;
  }
  if (file.type === 'thumbnail' || file.mimetype?.startsWith('image/')) {
    return 'image';
  }
  if (file.mimetype?.startsWith('video/')) {
    return 'video';
  }
  if (file.mimetype?.startsWith('audio/')) {
    return 'audio';
  }
  if (file.type === 'document' || file.mimetype === 'application/pdf') {
    return 'document';
  }
  return undefined;
};

const thumbnailFromEntity = (entity: Entity): { src?: string; kind?: ThumbnailKind } => {
  const files = [...(entity.documents ?? []), ...(entity.attachments ?? [])];
  const thumbnail = files.find(file => file.type === 'thumbnail' && file.filename);
  if (thumbnail?.filename) {
    return { src: `/api/files/${thumbnail.filename}`, kind: 'image' };
  }
  const image = files.find(file => file.mimetype?.startsWith('image/') && file.filename);
  if (image?.filename) {
    return { src: `/api/files/${image.filename}`, kind: 'image' };
  }
  const document = files.find(
    file => file.type === 'document' || file.mimetype === 'application/pdf'
  );
  if (document) {
    return { kind: 'document' };
  }
  const other = files.find(file => fileKind(file));
  return { kind: fileKind(other) };
};

export { metadataFieldsForCard, thumbnailFromEntity };
