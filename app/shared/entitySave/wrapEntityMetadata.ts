import isString from 'lodash/isString.js';
import { isUploadId } from './mediaMetadata.js';
import { isMediaProperty, shouldSkipValue } from './legacyTypes.js';
import type {
  LegacyEntity,
  LegacyMetadataValue,
  LegacyTemplate,
  MediaProperty,
  MetadataObjectSchemaLike,
} from './legacyTypes.js';

type FileLocalMetadataValues = Record<
  string,
  { value: string; attachment: number; timeLinks?: string }
>;

const buildFileLocalMetadataValues = (
  attachments: NonNullable<LegacyEntity['attachments']>
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

const resolveFieldValue = (metadataEntry: LegacyMetadataValue | undefined) =>
  typeof metadataEntry === 'object' &&
  metadataEntry !== null &&
  !Array.isArray(metadataEntry) &&
  metadataEntry.data !== undefined
    ? metadataEntry.data
    : metadataEntry;

const applyMediaTimeLinks = (
  property: MediaProperty | undefined,
  metadataEntry: LegacyMetadataValue | undefined,
  fieldValue: unknown,
  fileLocalMetadataValues: FileLocalMetadataValues
) => {
  let fileLocalID = fieldValue;
  if (!(property && metadataEntry && property.type === 'media' && isString(fieldValue))) {
    return fileLocalID;
  }

  const mediaExpGroups = fieldValue.match(/^\(?([\w+]{5,15})(, ({.+})\))?|$/);
  let timeLinks: string | undefined;
  if (mediaExpGroups?.[1]) {
    [, fileLocalID = fieldValue, , timeLinks] = mediaExpGroups;
  }
  if (
    isString(fileLocalID) &&
    fileLocalID.length < 20 &&
    timeLinks &&
    isUploadId(fileLocalID) &&
    fileLocalMetadataValues[fileLocalID]
  ) {
    fileLocalMetadataValues[fileLocalID] = {
      ...fileLocalMetadataValues[fileLocalID],
      timeLinks,
    };
  }
  return fileLocalID;
};

const wrapMetadataEntry = (
  key: string,
  metadataEntry: LegacyMetadataValue | undefined,
  mediaProperties: MediaProperty[],
  fileLocalMetadataValues: FileLocalMetadataValues
): MetadataObjectSchemaLike[] => {
  const property = mediaProperties.find(item => item.name === key);
  const fieldValue = resolveFieldValue(metadataEntry);

  if (isMediaProperty(property) && shouldSkipValue(fieldValue as LegacyMetadataValue)) {
    return [{ value: '' }];
  }

  const fileLocalID = applyMediaTimeLinks(
    property,
    metadataEntry,
    fieldValue,
    fileLocalMetadataValues
  );
  const metadataValue =
    typeof fileLocalID === 'string' ? fileLocalMetadataValues[fileLocalID] : undefined;

  if (Array.isArray(metadataEntry)) {
    return metadataEntry.map(value =>
      typeof value === 'object' && value !== null && 'value' in value
        ? { value: value.value }
        : { value }
    );
  }

  if (metadataValue) {
    return [metadataValue];
  }

  const resolvedValue =
    typeof metadataEntry === 'object' &&
    metadataEntry !== null &&
    !Array.isArray(metadataEntry) &&
    metadataEntry.data !== undefined
      ? { value: metadataEntry.data }
      : { value: metadataEntry };

  return [resolvedValue];
};

const wrapEntityMetadata = <T extends LegacyEntity>(
  entity: T,
  template?: LegacyTemplate | null
): T => {
  const mediaProperties =
    template?.properties?.filter(
      (property): property is MediaProperty =>
        property.type === 'image' || property.type === 'media'
    ) ?? [];

  if (!entity.metadata) {
    return entity;
  }

  const fileLocalMetadataValues = buildFileLocalMetadataValues(entity.attachments ?? []);
  const metadata = Object.keys(entity.metadata).reduce<Record<string, MetadataObjectSchemaLike[]>>(
    (wrappedMetadata, key) => ({
      ...wrappedMetadata,
      [key]: wrapMetadataEntry(
        key,
        entity.metadata?.[key],
        mediaProperties,
        fileLocalMetadataValues
      ),
    }),
    {}
  );

  return { ...entity, metadata };
};

export { wrapEntityMetadata };
