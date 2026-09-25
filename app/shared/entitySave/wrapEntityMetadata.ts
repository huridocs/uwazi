import type { MetadataObjectSchema, MetadataSchema } from '#shared/types/commonTypes.js';
import { mapMediaValue } from './mediaMetadata.js';
import { isLegacyMetadataObject, isMediaProperty, shouldSkipValue } from './legacyTypes.js';
import type { LegacyTemplate, MediaProperty, WrapableEntity } from './legacyTypes.js';

type WrappedEntity<T extends WrapableEntity> = Omit<T, 'metadata'> & {
  metadata?: MetadataSchema;
};

const resolveFieldValue = (metadataEntry: unknown) =>
  isLegacyMetadataObject(metadataEntry) && metadataEntry.data !== undefined
    ? metadataEntry.data
    : metadataEntry;

const toPropertyValue = (value: unknown): MetadataObjectSchema['value'] => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'object' && !(value instanceof File)) {
    return value as MetadataObjectSchema['value'];
  }
  return null;
};

const wrapArrayEntry = (metadataEntry: ReadonlyArray<unknown>): MetadataObjectSchema[] =>
  metadataEntry.map(entry => {
    if (typeof entry === 'object' && entry !== null && 'value' in entry) {
      const { value, ...rest } = entry;
      return { ...rest, value: toPropertyValue(value) };
    }
    return { value: toPropertyValue(entry) };
  });

const defaultWrappedValue = (metadataEntry: unknown): MetadataObjectSchema => ({
  value: toPropertyValue(resolveFieldValue(metadataEntry)),
});

type WrapEntryContext = {
  mediaProperties: MediaProperty[];
  attachments: NonNullable<WrapableEntity['attachments']>;
};

const wrapMetadataEntry = (
  key: string,
  metadataEntry: unknown,
  { mediaProperties, attachments }: WrapEntryContext
): MetadataObjectSchema[] => {
  const property = mediaProperties.find(item => item.name === key);
  const fieldValue = resolveFieldValue(metadataEntry);

  if (isMediaProperty(property)) {
    if (shouldSkipValue(fieldValue)) {
      return [{ value: '' }];
    }
    if (typeof fieldValue === 'string') {
      return [mapMediaValue(fieldValue, attachments, property.type)];
    }
  }

  if (Array.isArray(metadataEntry)) {
    return wrapArrayEntry(metadataEntry);
  }

  return [defaultWrappedValue(metadataEntry)];
};

const wrapEntityMetadata = <T extends WrapableEntity>(
  entity: T,
  template?: LegacyTemplate | null
): WrappedEntity<T> => {
  const mediaProperties =
    template?.properties?.filter(
      (property): property is MediaProperty =>
        property.type === 'image' || property.type === 'media'
    ) ?? [];

  const sourceMetadata = entity.metadata;
  if (!sourceMetadata) {
    const { metadata: _metadata, ...rest } = entity;
    return { ...rest };
  }

  const context: WrapEntryContext = {
    mediaProperties,
    attachments: entity.attachments ?? [],
  };
  const metadata = Object.keys(sourceMetadata).reduce<MetadataSchema>((acc, key) => {
    acc[key] = wrapMetadataEntry(key, sourceMetadata[key], context);
    return acc;
  }, {});

  return { ...entity, metadata };
};

export { wrapEntityMetadata };
export type { WrappedEntity };
