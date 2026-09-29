import type { Template } from '#app/apiResponseTypes.js';
import { readyDocuments } from '#shared/entityDefaultDocument.js';
import type { Entity } from '#V2/api/entities/types.js';
import {
  metadataDisplayPresets,
  type DisplayContext,
} from '#V2/Components/Metadata/display/index.js';
import { getMainDocument } from '#V2/formatters/index.js';
import { getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';
import type { EntityCardField } from './EntityCard.js';
import {
  DEFAULT_THUMB_FIT,
  thumbnailFitFromStyle,
  type ThumbFit,
  type ThumbnailKind,
} from './libraryCardDisplay.js';
import { libraryTableCellValue } from './libraryTableCellValue.js';

type CardThumbnail = {
  src?: string;
  propertyName?: string;
  kind?: ThumbnailKind;
  fit?: ThumbFit;
};

type TemplateProperty = NonNullable<Template['properties']>[number];

type ThumbnailFromEntityOptions = {
  locale?: string;
  defaultLanguage?: string;
};

type MetadataFieldsForCardOptions = {
  excludeProperty?: string;
  context?: DisplayContext;
};

const THUMBNAIL_PROPERTY_TYPES = new Set(['preview', 'image', 'media']);
const CARD_MEDIA_TYPES = new Set(['media', 'preview', 'image']);

const defaultDisplayContext = (locale = 'en'): DisplayContext => ({
  ...metadataDisplayPresets.compact,
  locale,
});

const metadataStringValue = (values?: { value?: unknown }[]): string | undefined => {
  if (!values?.length) {
    return undefined;
  }
  const match = values.find(item => typeof item.value === 'string' && item.value);
  return typeof match?.value === 'string' ? match.value : undefined;
};

const fileUrl = (value: string): string => {
  if (value.startsWith('/') || /^https?:\/\//i.test(value)) {
    return value;
  }
  return `/api/files/${value}`;
};

const unwrapMediaValue = (value: string): string | undefined => {
  if (!value.startsWith('(')) {
    return value;
  }
  const match = value.match(/^\(([^,]+)/);
  const inner = match?.[1]?.trim();
  return inner || undefined;
};

const visualSrc = (entity: Entity, property: TemplateProperty): string | undefined => {
  const fromMetadata = metadataStringValue(entity.metadata?.[property.name]);
  const unwrapped = fromMetadata ? unwrapMediaValue(fromMetadata) : undefined;
  if (unwrapped) {
    return fileUrl(unwrapped);
  }
  if (property.type === 'preview' && entity.preview) {
    return fileUrl(entity.preview);
  }
  return undefined;
};

const UNKNOWN_MIME = 'application/octet-stream';

const fileTokenFromSrc = (src: string): string => src.split(/[#?]/)[0].split('/').pop() || '';

const knownMimeFromUrl = (url: string): string | undefined => {
  const mime = getMimetypeFromUrl(url);
  return mime === UNKNOWN_MIME ? undefined : mime;
};

const fileMatchingSrc = (src: string, entity: Entity) => {
  const token = fileTokenFromSrc(src);
  if (!token) {
    return undefined;
  }
  return [...(entity.attachments ?? []), ...(entity.documents ?? [])].find(
    file => file.filename === token || file._id === token || file.originalname === token
  );
};

const mimeFromEntityFiles = (src: string, entity: Entity): string | undefined => {
  const match = fileMatchingSrc(src, entity);
  if (!match) {
    return undefined;
  }
  return (
    match.mimetype || (match.originalname && knownMimeFromUrl(match.originalname)) || undefined
  );
};

const mimeForMediaSrc = (src: string, entity: Entity): string =>
  knownMimeFromUrl(src) ?? mimeFromEntityFiles(src, entity) ?? UNKNOWN_MIME;

const mediaThumbnailKind = (src: string, entity: Entity): ThumbnailKind => {
  const mime = mimeForMediaSrc(src, entity);
  if (mime.startsWith('audio/')) {
    return 'audio';
  }
  if (mime.startsWith('image/')) {
    return 'image';
  }
  return 'video';
};

const thumbnailKindFor = (
  property: TemplateProperty,
  src: string,
  entity: Entity
): ThumbnailKind => {
  if (property.type === 'preview') {
    return 'document';
  }
  if (property.type === 'image') {
    return 'image';
  }
  return mediaThumbnailKind(src, entity);
};

const documentThumbnailSrc = (
  entity: Entity,
  options?: ThumbnailFromEntityOptions
): string | undefined => {
  if (entity.preview) {
    return fileUrl(entity.preview);
  }
  const locale = options?.locale ?? entity.language;
  const document =
    getMainDocument(readyDocuments(entity.documents), locale, options?.defaultLanguage) ??
    entity.documents?.[0];
  return document?._id ? `/api/files/${String(document._id)}.jpg` : undefined;
};

const showInCardVisualThumbnail = (
  entity: Entity,
  properties: NonNullable<Template['properties']>
): CardThumbnail | undefined => {
  const property = properties.find(
    item => item.showInCard && THUMBNAIL_PROPERTY_TYPES.has(item.type) && visualSrc(entity, item)
  );
  if (!property) {
    return undefined;
  }
  const src = visualSrc(entity, property);
  if (!src) {
    return undefined;
  }
  return {
    src,
    propertyName: property.name,
    kind: thumbnailKindFor(property, src, entity),
    fit: thumbnailFitFromStyle(property.style),
  };
};

const thumbnailFromEntity = (
  entity: Entity,
  template?: Template,
  options?: ThumbnailFromEntityOptions
): CardThumbnail => {
  const properties = template?.properties ?? [];
  const fromShowInCard = showInCardVisualThumbnail(entity, properties);
  if (fromShowInCard) {
    return fromShowInCard;
  }
  if (entity.documents?.length) {
    const src = documentThumbnailSrc(entity, options);
    return src ? { src, kind: 'document', fit: DEFAULT_THUMB_FIT } : {};
  }
  return {};
};

const metadataFieldsForCard = (
  entity: Entity,
  template?: Template,
  options?: MetadataFieldsForCardOptions
): EntityCardField[] => {
  const properties = template?.properties ?? [];
  const context = options?.context ?? defaultDisplayContext();
  const fields: EntityCardField[] = [];

  properties.forEach(property => {
    if (fields.length >= 3 || !property.showInCard || property.name === options?.excludeProperty) {
      return;
    }
    const formatted = libraryTableCellValue(
      property.type,
      entity.metadata?.[property.name],
      context
    );
    const text =
      formatted.text ||
      (property.type === 'preview' && entity.preview
        ? libraryTableCellValue('preview', [{ value: entity.preview }], context).text
        : '');
    if (!text) {
      return;
    }
    fields.push({
      id: property.name,
      label: property.label,
      value: text,
      interactive: CARD_MEDIA_TYPES.has(property.type),
    });
  });

  return fields;
};

export type { CardThumbnail, MetadataFieldsForCardOptions, ThumbnailFromEntityOptions };
export { metadataFieldsForCard, thumbnailFromEntity };
