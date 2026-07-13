import type { IncomingHttpHeaders } from 'http';
import type { ClientBlobFile, ClientFile } from '#app/istore.js';
import type { RequestContext } from '#shared/apiClient/index.js';
import type { EntityWithFilesSchema } from '#shared/types/entityType.js';
import type { Entity, FileType } from '../types.js';

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
type SaveWithFilesContext = Omit<RequestContext, 'headers'> & {
  headers?: IncomingHttpHeaders;
  mediaPropertyNames?: ReadonlySet<string>;
  mediaPropertyTypes?: ReadonlyMap<string, 'image' | 'media'>;
};

export type {
  SaveWithFilesAttachment,
  SaveWithFilesContext,
  SaveWithFilesDocument,
  SaveWithFilesEntity,
  SaveWithFilesResponse,
  EntityFile,
};
