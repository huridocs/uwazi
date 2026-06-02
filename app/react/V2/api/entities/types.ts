import type { MetadataObjectSchema as CommonMetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { EntityWithFilesSchema } from '#shared/types/entityType.js';
import type { FileType as ApiFileType } from '#shared/types/fileType.js';

interface FileType extends Omit<ApiFileType, '_id'> {
  _id: string;
}

type MetadataObjectSchema = CommonMetadataObjectSchema & {
  // authorized is either false or not present.
  authorized?: false;
};

type MetadataSchema = {
  [k: string]: MetadataObjectSchema[] | undefined;
};

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
  editDate?: number;
  user: string;
  documents?: FileType[];
  attachments?: FileType[];
  metadata?: MetadataSchema;
  icon?: {
    _id: string;
    type: string;
    label: string;
  };
  permissions?: EntityWithFilesSchema['permissions'];
}

export type { Entity, FileType, MetadataSchema, MetadataObjectSchema };
