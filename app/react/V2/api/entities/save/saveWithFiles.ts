import type { ClientBlobFile, ClientFile } from '#app/istore.js';
import { constructFile } from '#shared/fileUploadUtils.js';
import type { ApiResponse, MultipartPayload } from '#shared/apiClient/index.js';
import { apiClient } from '#V2/api/client.js';
import { mapMediaMetadataForSave } from './mapMediaMetadataForSave.js';
import type {
  EntityFile,
  SaveWithFilesAttachment,
  SaveWithFilesContext,
  SaveWithFilesDocument,
  SaveWithFilesEntity,
  SaveWithFilesResponse,
} from './types.js';

const isClientBlobFile = (file: SaveWithFilesDocument): file is ClientBlobFile =>
  'originalFile' in file;

const isClientFileWithSerializedFile = (
  file: SaveWithFilesAttachment
): file is ClientFile & { serializedFile: string } =>
  'serializedFile' in file && typeof file.serializedFile === 'string';

const stripSerializedFile = (file: SaveWithFilesAttachment): EntityFile => {
  if (!('serializedFile' in file)) {
    return file;
  }
  const { serializedFile: _serializedFile, ...fileToSave } = file;
  return fileToSave;
};

const documentFile = (file: ClientBlobFile): File => {
  if (file.originalName && file.originalName !== file.originalFile.name) {
    const type = file.originalFile.type || undefined;
    return new File([file.originalFile], file.originalName, { type });
  }
  return file.originalFile;
};

const buildSaveWithFilesPayload = (entity: SaveWithFilesEntity): MultipartPayload => {
  const attachments = entity.attachments?.map(stripSerializedFile) ?? [];
  const supportingFiles =
    entity.attachments?.filter(isClientFileWithSerializedFile).map(constructFile) ?? [];
  const existingDocuments = entity.documents?.filter(file => !isClientBlobFile(file)) ?? [];
  const addedDocuments = entity.documents?.filter(isClientBlobFile).map(documentFile) ?? [];

  const entityToSend = {
    ...entity,
    documents: existingDocuments,
    ...(attachments.length > 0 && { attachments }),
  };

  return {
    fields: [
      { name: 'entity', value: JSON.stringify(entityToSend) },
      ...supportingFiles.map((file, index) => ({
        name: `attachments_originalname[${index}]`,
        value: file.name,
      })),
      ...addedDocuments.map((file, index) => ({
        name: `documents_originalname[${index}]`,
        value: file.name,
      })),
    ],
    files: [
      ...supportingFiles.map((file, index) => ({
        name: `attachments[${index}]`,
        file,
        filename: file.name,
      })),
      ...addedDocuments.map((file, index) => ({
        name: `documents[${index}]`,
        file,
        filename: file.name,
      })),
    ],
  };
};

const saveWithFiles = async (
  entity: SaveWithFilesEntity,
  ctx?: SaveWithFilesContext
): Promise<ApiResponse<SaveWithFilesResponse>> => {
  const preparedEntity =
    ctx?.mediaPropertyNames && ctx.mediaPropertyTypes
      ? mapMediaMetadataForSave(entity, ctx.mediaPropertyNames, ctx.mediaPropertyTypes)
      : entity;
  const headers = Object.fromEntries(
    Object.entries(ctx?.headers ?? {}).filter((entry): entry is [string, string] => {
      const [, value] = entry;
      return typeof value === 'string';
    })
  );
  if (
    typeof preparedEntity.language === 'string' &&
    !headers['Content-Language'] &&
    !headers['content-language']
  ) {
    headers['Content-Language'] = preparedEntity.language;
  }

  return apiClient.postMultipart<SaveWithFilesResponse>(
    'entities',
    buildSaveWithFilesPayload(preparedEntity),
    {
      ...ctx,
      headers,
    }
  );
};

export { buildSaveWithFilesPayload, saveWithFiles };
