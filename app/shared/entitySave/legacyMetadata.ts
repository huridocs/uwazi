import uniqueID from '#shared/uniqueID.js';
import { readFileAsBase64 } from '#shared/fileUploadUtils.js';
import type { ClientFile } from '#app/istore.js';
import { prepareFiles } from './prepareFiles.js';
import { wrapEntityMetadata } from './wrapEntityMetadata.js';
import { shouldSkipValue } from './legacyTypes.js';
import type { LegacyEntity, LegacyTemplate, MediaProperty } from './legacyTypes.js';

const prepareMetadataAndFiles = async (
  values: LegacyEntity & { template?: string },
  attachedFiles: File[],
  template: LegacyTemplate & { _id?: string },
  mediaProperties: MediaProperty[]
) => {
  const { metadataFiles, entityAttachments, files } = await prepareFiles(mediaProperties, values);

  const cleanedMetadata = { ...values.metadata };
  Object.keys(cleanedMetadata).forEach(key => {
    const metadataValue = cleanedMetadata[key];
    if (metadataValue && shouldSkipValue(metadataValue)) {
      cleanedMetadata[key] = '';
    }
  });

  const fields = { ...cleanedMetadata, ...metadataFiles };
  const entity = { ...values, metadata: fields, attachments: entityAttachments };
  const wrappedEntity = wrapEntityMetadata(entity, template);
  wrappedEntity.file = values.file ? (values.file as File[])[0] : undefined;
  wrappedEntity.attachments = [...files, ...attachedFiles];
  return { ...wrappedEntity, template: template._id };
};

const registerMediaAttachment = async (
  entitySharedId: string,
  file: File,
  fileLocalID = uniqueID()
): Promise<ClientFile> =>
  new Promise((resolve, reject) => {
    readFileAsBase64(file, serializedFile => {
      resolve({
        _id: fileLocalID,
        originalname: file.name,
        filename: file.name,
        serializedFile,
        type: 'attachment',
        mimetype: file.type,
        entity: entitySharedId,
        fileLocalID,
      });
    }).catch(reject);
  });

export { prepareMetadataAndFiles, registerMediaAttachment, wrapEntityMetadata };
