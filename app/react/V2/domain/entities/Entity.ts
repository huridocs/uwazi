import { FileType } from 'shared/types/fileType';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import {
  EntityPermissions,
  MetadataProperty,
  DateMetadataProperty,
  EntityTemplate,
  EntityReference,
} from './types';

export interface Entity {
  readonly _id: string;
  readonly sharedId: string;
  readonly title: string;
  readonly language: string;
  readonly template?: EntityTemplate;
  creationDate: DateMetadataProperty;
  editDate: DateMetadataProperty;
  readonly icon?: { _id: string } | any;
  readonly permissions?: EntityPermissions;
  metadata: MetadataProperty[];
  rawEntity?: EntityWithFilesSchema;
  references?: EntityReference[];
  mainDocument?: FileType;
  documents?: FileType[];
  attachments?: FileType[];
}
