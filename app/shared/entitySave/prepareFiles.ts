import uniqueID from '#shared/uniqueID.js';
import { isLegacyMetadataObject, shouldSkipValue } from './legacyTypes.js';
import type {
  LegacyAttachment,
  LegacyEntity,
  LegacyMetadataObject,
  LegacyMetadataValue,
  MediaProperty,
} from './legacyTypes.js';

type PrepareFilesResult = {
  metadataFiles: Record<string, string>;
  entityAttachments: LegacyAttachment[];
  files: File[];
};

const isMediaObjectValue = (
  metadataValue: LegacyMetadataValue
): metadataValue is LegacyMetadataObject & { data: string | File } =>
  isLegacyMetadataObject(metadataValue) &&
  metadataValue.data !== undefined &&
  metadataValue.data !== null;

const prepareFiles = async (
  mediaProperties: MediaProperty[],
  values: Pick<LegacyEntity, 'metadata'>
): Promise<PrepareFilesResult> => {
  const metadataFiles: Record<string, string> = {};
  const entityAttachments: LegacyAttachment[] = [];
  const files: File[] = [];

  if (!values.metadata) {
    return { metadataFiles, entityAttachments, files };
  }

  const registerFile = (propertyName: string, file: File, timeLinks?: string) => {
    const fileID = uniqueID();
    metadataFiles[propertyName] = fileID;
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

  const prepareProperty = (property: MediaProperty) => {
    const metadataValue = values.metadata?.[property.name];
    if (!metadataValue || shouldSkipValue(metadataValue) || !isMediaObjectValue(metadataValue)) {
      return;
    }
    const { data, originalFile } = metadataValue;
    if (originalFile instanceof File) {
      registerFile(property.name, originalFile);
      return;
    }
    if (data instanceof File) {
      registerFile(property.name, data);
    }
  };

  await Promise.all(mediaProperties.map(async property => prepareProperty(property)));

  return { metadataFiles, entityAttachments, files };
};

export { prepareFiles };
