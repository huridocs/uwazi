import uniqueID from '#shared/uniqueID.js';
import { shouldSkipValue } from './legacyTypes.js';
import type { LegacyEntity, LegacyMetadataValue, MediaProperty } from './legacyTypes.js';

const preparePropertyFile = (
  property: MediaProperty,
  metadataValue: LegacyMetadataValue | undefined,
  metadataFiles: Record<string, string>,
  entityAttachments: NonNullable<LegacyEntity['attachments']>,
  files: File[]
) => {
  if (!metadataValue || shouldSkipValue(metadataValue)) {
    return;
  }
  if (typeof metadataValue !== 'object' || Array.isArray(metadataValue) || !metadataValue.data) {
    return;
  }

  const { data, originalFile } = metadataValue;
  const registerFile = (file: File, timeLinks?: string) => {
    const fileID = uniqueID();
    metadataFiles[property.name] = fileID;
    entityAttachments.push({
      originalname: file.name,
      filename: file.name,
      type: 'attachment',
      mimetype: file.type,
      fileLocalID: fileID,
      timeLinks,
    });
    files.push(file);
  };

  if (originalFile instanceof File) {
    registerFile(originalFile);
    return;
  }
  if (data instanceof File) {
    registerFile(data);
  }
};

const prepareFiles = async (
  mediaProperties: MediaProperty[],
  values: { metadata?: Record<string, LegacyMetadataValue> }
) => {
  const metadataFiles: Record<string, string> = {};
  const entityAttachments: NonNullable<LegacyEntity['attachments']> = [];
  const files: File[] = [];

  if (!values.metadata) {
    return { metadataFiles, entityAttachments, files };
  }

  await Promise.all(
    mediaProperties.map(async property => {
      preparePropertyFile(
        property,
        values.metadata?.[property.name],
        metadataFiles,
        entityAttachments,
        files
      );
    })
  );

  return { metadataFiles, entityAttachments, files };
};

export { prepareFiles };
