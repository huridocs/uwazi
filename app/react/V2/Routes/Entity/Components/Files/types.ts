import { FileType as ApiFileType } from '#shared/types/fileType.js';

type FileCategory = 'primary' | 'supporting';

type FileKind = 'pdf' | 'audio' | 'video' | 'image' | 'link' | 'document';

type FileEditFocus = 'name' | 'language';

type FileProcessStatus = NonNullable<ApiFileType['status']>;

type FileSourceType =
  'mainDocument' | 'document' | 'attachment' | 'externalURL' | 'image' | 'media';

type EntityFileForView = Partial<ApiFileType> & {
  _id?: string;
  fileType: FileSourceType;
};

type EntityFileRow = {
  rowId: string;
  displayName: string;
  kind: FileKind;
  typeLabel: string;
  sizeLabel: string;
  languageKey: string;
  modifiedLabel: string;
  modifiedTimestamp?: number;
  category: FileCategory;
  fileType: FileSourceType;
  status?: FileProcessStatus;
  raw: EntityFileForView;
};

export type {
  EntityFileRow,
  EntityFileForView,
  FileCategory,
  FileEditFocus,
  FileKind,
  FileProcessStatus,
  FileSourceType,
};
