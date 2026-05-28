import { FileType as ApiFileType } from '#shared/types/fileType.js';

type FileCategory = 'primary' | 'supporting';

type FileSourceType =
  | 'mainDocument'
  | 'document'
  | 'attachment'
  | 'externalURL'
  | 'image'
  | 'media';

type EntityFileForView = Partial<ApiFileType> & {
  _id?: string;
  fileType: FileSourceType;
};

type EntityFileRow = {
  rowId: string;
  displayName: string;
  typeLabel: string;
  sizeLabel: string;
  languageKey: string;
  modifiedLabel: string;
  modifiedTimestamp?: number;
  isActiveMain: boolean;
  category: FileCategory;
  fileType: FileSourceType;
  raw: EntityFileForView;
};

export type { EntityFileRow, EntityFileForView, FileCategory, FileSourceType };
