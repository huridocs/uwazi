import { FileType } from 'shared/types/fileType';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import { AdapterEntityTemplate } from 'V2/application/services/processors/types';
import { EntityPermissions, MetadataProperty, DateMetadataProperty } from './types';

export interface Entity {
  readonly _id: string;
  readonly sharedId: string;
  readonly title: string;
  readonly language: string;
  readonly template?: AdapterEntityTemplate;
  creationDate: DateMetadataProperty;
  editDate: DateMetadataProperty;
  readonly icon?: { _id: string } | any;
  readonly permissions?: EntityPermissions;
  metadata: MetadataProperty[];
  rawEntity?: EntityWithFilesSchema;
  mainDocument?: FileType;
  documents?: FileType[];
  attachments?: FileType[];
}
