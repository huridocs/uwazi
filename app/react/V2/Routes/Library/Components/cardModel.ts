import type { Template } from '#app/apiResponseTypes.js';
import { readyDocuments } from '#shared/entityDefaultDocument.js';
import type { Entity } from '#V2/api/entities/types.js';
import {
  metadataDisplayPresets,
  type DisplayContext,
} from '#V2/Components/Metadata/display/index.js';
import { getMainDocument } from '#V2/formatters/index.js';
import type { EntityCardField } from './EntityCard.js';
import type { ThumbnailKind } from './libraryCardDisplay.js';
import { libraryTableCellValue } from './libraryTableCellValue.js';

type CardThumbnail = {
  src?: string;
  propertyName?: string;
  kind?: ThumbnailKind;
};

type ThumbnailFromEntityOptions = {
  locale?: string;
  defaultLanguage?: string;
};

type MetadataFieldsForCardOptions = {
  excludeProperty?: string;
  context?: DisplayContext;
};

const VISUAL_PROPERTY_TYPES = new Set(['preview', 'image']);
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

const visualSrc = (
  entity: Entity,
  property: NonNullable<Template['properties']>[number]
): string | undefined => {
  const fromMetadata = metadataStringValue(entity.metadata?.[property.name]);
  if (fromMetadata) {
    return fileUrl(fromMetadata);
  }
  if (property.type === 'preview' && entity.preview) {
    return fileUrl(entity.preview);
  }
  return undefined;
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
  const property = properties.find(item => item.showInCard && VISUAL_PROPERTY_TYPES.has(item.type));
  if (!property) {
    return undefined;
  }
  const src = visualSrc(entity, property);
  const kind: ThumbnailKind = property.type === 'preview' ? 'document' : 'image';
  return src ? { src, propertyName: property.name, kind } : { propertyName: property.name };
};

const firstImageThumbnail = (
  entity: Entity,
  properties: NonNullable<Template['properties']>
): CardThumbnail | undefined => {
  const property = properties.find(item => item.type === 'image' && visualSrc(entity, item));
  if (!property) {
    return undefined;
  }
  return { src: visualSrc(entity, property), propertyName: property.name, kind: 'image' };
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
    return src ? { src, kind: 'document' } : {};
  }
  return firstImageThumbnail(entity, properties) ?? {};
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
    if (!formatted.text) {
      return;
    }
    fields.push({
      id: property.name,
      label: property.label,
      value: formatted.text,
      interactive: CARD_MEDIA_TYPES.has(property.type),
    });
  });

  return fields;
};

export type { CardThumbnail, MetadataFieldsForCardOptions, ThumbnailFromEntityOptions };
export { metadataFieldsForCard, thumbnailFromEntity };
