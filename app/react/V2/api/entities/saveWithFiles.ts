import type { IncomingHttpHeaders } from 'http';
import type { ClientBlobFile, ClientFile } from '#app/istore.js';
import { constructFile } from '#shared/fileUploadUtils.js';
import type { ApiResponse, MultipartPayload, RequestContext } from '#shared/apiClient/index.js';
import type { EntityWithFilesSchema } from '#shared/types/entityType.js';
import { apiClient } from '#V2/api/client.js';
import type { Entity, FileType } from './types.js';

type EntityFile = FileType;
type ExistingDocument = NonNullable<Entity['documents']>[number];
type ExistingAttachment = NonNullable<Entity['attachments']>[number];
type SaveWithFilesDocument = ExistingDocument | ClientBlobFile;
type SaveWithFilesAttachment = ExistingAttachment | ClientFile;
type SaveWithFilesEntity = Omit<EntityWithFilesSchema, 'documents' | 'attachments'> & {
  documents?: SaveWithFilesDocument[];
  attachments?: SaveWithFilesAttachment[];
};
type SaveWithFilesResponse = {
  entity?: Entity;
  errors?: unknown[];
};

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

type SaveWithFilesContext = Omit<RequestContext, 'headers'> & {
  headers?: IncomingHttpHeaders;
};

const saveWithFiles = async (
  entity: SaveWithFilesEntity,
  ctx?: SaveWithFilesContext
): Promise<ApiResponse<SaveWithFilesResponse>> => {
  const headers = Object.fromEntries(
    Object.entries(ctx?.headers ?? {}).filter((entry): entry is [string, string] => {
      const [, value] = entry;
      return typeof value === 'string';
    })
  );
  if (
    typeof entity.language === 'string' &&
    !headers['Content-Language'] &&
    !headers['content-language']
  ) {
    headers['Content-Language'] = entity.language;
  }

  return apiClient.postMultipart<SaveWithFilesResponse>(
    'entities',
    buildSaveWithFilesPayload(entity),
    {
      ...ctx,
      headers,
    }
  );
};

export { buildSaveWithFilesPayload, saveWithFiles };
export type { SaveWithFilesEntity, SaveWithFilesResponse };
