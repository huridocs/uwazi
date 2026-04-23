import { MetadataSchema, MetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { EntityWithFilesSchema } from '#shared/types/entityType.js';
import type { FileType as ApiFileType } from '#shared/types/fileType.js';

interface FileType extends Omit<ApiFileType, '_id'> {
  _id: string;
}

interface Entity extends Omit<
  EntityWithFilesSchema,
  '_id' | 'sharedId' | 'language' | 'title' | 'template' | 'creationDate' | 'user'
> {
  _id: string;
  sharedId: string;
  language: string;
  title: string;
  template: string;
  creationDate: number;
  user: string;
  documents?: FileType[];
  attachments?: FileType[];
  metadata?: MetadataSchema;
}

export type { Entity, MetadataSchema, MetadataObjectSchema };
