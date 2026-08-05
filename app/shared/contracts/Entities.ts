import { EntityWithFilesSchema } from '#shared/types/entityType.js';

/** This is a "multipart/form-data" request */
export type CreateEntityFromPDFRequest = {
  templateId?: string;
  file: File | Blob;
};

export type CreateEntityFromPDFResponse = {
  // This Type will probably be replaced by something new,
  // since its type set all properties as optional, which is NOT true in practice.
  data: EntityWithFilesSchema;
};
