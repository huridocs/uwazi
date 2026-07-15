import isString from 'lodash/isString.js';
import type { MetadataObjectSchema, MetadataSchema } from '#shared/types/commonTypes.js';
import { isUploadId } from './mediaMetadata.js';
import { isLegacyMetadataObject, isMediaProperty, shouldSkipValue } from './legacyTypes.js';
import type {
  LegacyTemplate,
  MediaProperty,
  WrapableAttachment,
  WrapableEntity,
} from './legacyTypes.js';

type LinkedAttachmentValue = {
  value: string;
  attachment: number;
  timeLinks?: string;
};
type FileLocalMetadataValues = Record<string, LinkedAttachmentValue>;

type WrappedEntity<T extends WrapableEntity> = Omit<T, 'metadata'> & {
  metadata?: MetadataSchema;
};

const buildFileLocalMetadataValues = (
  attachments: ReadonlyArray<WrapableAttachment>
): FileLocalMetadataValues =>
  attachments
    .filter(attachment => Boolean(attachment.fileLocalID))
    .reduce<FileLocalMetadataValues>((previousValue, attachment, index) => {
      const { fileLocalID } = attachment;
      if (!fileLocalID) {
        return previousValue;
      }
      return {
        ...previousValue,
        [fileLocalID]: {
          value: '',
          attachment: index,
          timeLinks: attachment.timeLinks,
        },
      };
    }, {});

const resolveFieldValue = (metadataEntry: unknown) =>
  isLegacyMetadataObject(metadataEntry) && metadataEntry.data !== undefined
    ? metadataEntry.data
    : metadataEntry;

const resolveMediaFileLocalId = (
  property: MediaProperty | undefined,
  metadataEntry: unknown,
  fieldValue: unknown
): { fileLocalID: unknown; timeLinks?: string } => {
  if (!(property && metadataEntry && property.type === 'media' && isString(fieldValue))) {
    return { fileLocalID: fieldValue };
  }

  const mediaExpGroups = fieldValue.match(/^\(?([\w+]{5,15})(, ({.+})\))?|$/);
  if (!mediaExpGroups?.[1]) {
    return { fileLocalID: fieldValue };
  }

  const [, matchedId = fieldValue, , timeLinks] = mediaExpGroups;
  return { fileLocalID: matchedId, timeLinks };
};

const withTimeLinks = (
  values: FileLocalMetadataValues,
  fileLocalID: unknown,
  timeLinks?: string
): FileLocalMetadataValues => {
  if (
    !timeLinks ||
    !isString(fileLocalID) ||
    fileLocalID.length >= 20 ||
    !isUploadId(fileLocalID) ||
    !values[fileLocalID]
  ) {
    return values;
  }
  return {
    ...values,
    [fileLocalID]: { ...values[fileLocalID], timeLinks },
  };
};

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
      const { value } = entry;
      return { value: toPropertyValue(value) };
    }
    return { value: toPropertyValue(entry) };
  });

const defaultWrappedValue = (metadataEntry: unknown): MetadataObjectSchema => {
  if (isLegacyMetadataObject(metadataEntry) && metadataEntry.data !== undefined) {
    return { value: toPropertyValue(metadataEntry.data) };
  }
  return { value: toPropertyValue(metadataEntry) };
};

const wrapMetadataEntry = (
  key: string,
  metadataEntry: unknown,
  mediaProperties: MediaProperty[],
  fileLocalMetadataValues: FileLocalMetadataValues
): { wrapped: MetadataObjectSchema[]; values: FileLocalMetadataValues } => {
  const property = mediaProperties.find(item => item.name === key);
  const fieldValue = resolveFieldValue(metadataEntry);

  if (isMediaProperty(property) && shouldSkipValue(fieldValue)) {
    return { wrapped: [{ value: '' }], values: fileLocalMetadataValues };
  }

  const { fileLocalID, timeLinks } = resolveMediaFileLocalId(property, metadataEntry, fieldValue);
  const values = withTimeLinks(fileLocalMetadataValues, fileLocalID, timeLinks);
  const metadataValue = typeof fileLocalID === 'string' ? values[fileLocalID] : undefined;

  if (Array.isArray(metadataEntry)) {
    return { wrapped: wrapArrayEntry(metadataEntry), values };
  }

  return {
    wrapped: [metadataValue ?? defaultWrappedValue(metadataEntry)],
    values,
  };
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

  if (!entity.metadata) {
    const { metadata: _metadata, ...rest } = entity;
    return { ...rest };
  }

  const { metadata } = Object.keys(entity.metadata).reduce<{
    metadata: MetadataSchema;
    values: FileLocalMetadataValues;
  }>(
    (state, key) => {
      const { wrapped, values } = wrapMetadataEntry(
        key,
        entity.metadata?.[key],
        mediaProperties,
        state.values
      );
      return {
        metadata: { ...state.metadata, [key]: wrapped },
        values,
      };
    },
    {
      metadata: {},
      values: buildFileLocalMetadataValues(entity.attachments ?? []),
    }
  );

  return { ...entity, metadata };
};

export { wrapEntityMetadata };
export type { WrappedEntity };
