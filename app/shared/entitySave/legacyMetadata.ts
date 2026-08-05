import uniqueID from '#shared/uniqueID.js';
import { readFileAsBase64 } from '#shared/fileUploadUtils.js';
import type { MetadataSchema } from '#shared/types/commonTypes.js';
import type { ClientFile } from '#app/istore.js';
import { prepareFiles } from './prepareFiles.js';
import { wrapEntityMetadata } from './wrapEntityMetadata.js';
import { isMediaProperty, shouldSkipValue } from './legacyTypes.js';
import type {
  LegacyEntity,
  LegacyMetadataValue,
  LegacyTemplate,
  MediaProperty,
} from './legacyTypes.js';
import type { TemplateProperty } from './types.js';

type PreparedLegacyEntity = Omit<LegacyEntity, 'attachments' | 'file' | 'template' | 'metadata'> & {
  template?: string;
  file?: File;
  attachments: File[];
  metadata: MetadataSchema;
};

const toMediaProperties = (
  mediaProperties: ReadonlyArray<TemplateProperty | MediaProperty>
): MediaProperty[] => mediaProperties.filter(isMediaProperty);

const prepareMetadataAndFiles = async (
  values: LegacyEntity,
  attachedFiles: File[],
  template: LegacyTemplate,
  mediaProperties: ReadonlyArray<TemplateProperty | MediaProperty>
): Promise<PreparedLegacyEntity> => {
  const mediaProps = toMediaProperties(mediaProperties);
  const { metadataFiles, entityAttachments, files } = await prepareFiles(mediaProps, values);

  const cleanedMetadata: Record<string, LegacyMetadataValue> = { ...values.metadata };
  Object.keys(cleanedMetadata).forEach(key => {
    const metadataValue = cleanedMetadata[key];
    if (metadataValue !== undefined && shouldSkipValue(metadataValue)) {
      cleanedMetadata[key] = '';
    }
  });

  const fields = { ...cleanedMetadata, ...metadataFiles };
  const entity = { ...values, metadata: fields, attachments: entityAttachments };
  const wrappedEntity = wrapEntityMetadata(entity, template);
  const primaryFile = Array.isArray(values.file) ? values.file[0] : values.file;
  const templateId = typeof template._id === 'string' ? template._id : undefined;

  return {
    ...wrappedEntity,
    file: primaryFile instanceof File ? primaryFile : undefined,
    attachments: [...files, ...attachedFiles],
    template: templateId,
    metadata: wrappedEntity.metadata ?? {},
  };
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
export type { PreparedLegacyEntity };
