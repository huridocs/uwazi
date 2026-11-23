import type { MetadataObjectSchema, MetadataSchema } from '#shared/types/commonTypes.js';
import { mapMediaValue } from './mediaMetadata.js';
import {
  applyStoredAttributes,
  omitMetadataAttributes,
  type MetadataAttributesSidecar,
} from './metadataAttributes.js';
import { isLegacyMetadataObject, isMediaProperty, shouldSkipValue } from './legacyTypes.js';
import type { LegacyTemplate, MediaProperty, WrapableEntity } from './legacyTypes.js';

type WrappedEntity<T extends WrapableEntity> = Omit<T, 'metadata' | 'metadataAttributes'> & {
  metadata?: MetadataSchema;
};

const resolveFieldValue = (metadataEntry: unknown) =>
  isLegacyMetadataObject(metadataEntry) && metadataEntry.data !== undefined
    ? metadataEntry.data
    : metadataEntry;

const isFileValue = (value: object) => typeof File !== 'undefined' && value instanceof File;

const toPropertyValue = (value: unknown): MetadataObjectSchema['value'] => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'object' && !isFileValue(value)) {
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

const readSidecar = (entity: object): MetadataAttributesSidecar | undefined => {
  if (!('metadataAttributes' in entity)) {
    return undefined;
  }
  const { metadataAttributes } = entity as { metadataAttributes?: MetadataAttributesSidecar };
  return metadataAttributes;
};

const entityWithoutMetadata = <T extends WrapableEntity>(entity: T): WrappedEntity<T> => {
  const { metadata: _metadata, ...rest } = omitMetadataAttributes(entity);
  return { ...rest } as WrappedEntity<T>;
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

  const sidecar = readSidecar(entity);
  const sourceMetadata = entity.metadata;
  if (!sourceMetadata) {
    return entityWithoutMetadata(entity);
  }

  const context: WrapEntryContext = {
    mediaProperties,
    attachments: entity.attachments ?? [],
  };
  const metadata = Object.keys(sourceMetadata).reduce<MetadataSchema>((acc, key) => {
    acc[key] = applyStoredAttributes(
      wrapMetadataEntry(key, sourceMetadata[key], context),
      sidecar?.[key]
    );
    return acc;
  }, {});

  return { ...omitMetadataAttributes(entity), metadata } as WrappedEntity<T>;
};

export { wrapEntityMetadata };
export type { WrappedEntity };
