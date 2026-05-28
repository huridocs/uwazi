import { ObjectId } from 'mongodb';
import { LanguageISO6393 } from '#shared/language/languageISO639_3.js';
import type { TableOfContent } from '#api/core/domain/files/ProcessedPDF.js';

export type {
  ProcessingPDFDTO,
  ProcessedPDFDTO,
  FileAttachmentDTO,
  URLAttachmentDTO,
  ThumbnailDTO,
  CustomDTO,
  FileDTO as fileDTO,
} from '#api/core/domain/files/domainTypes.js';

type BaseFileDBO = {
  _id: ObjectId;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  creationDate: number;
};

export type BaseDocument = BaseFileDBO & {
  type: 'document';
  entity: string;
};

export type ProcessingPDFDBO = BaseDocument & {
  status: 'processing' | 'failed';
};

export type ProcessedPDFDBO = BaseDocument & {
  totalPages: number;
  language: LanguageISO6393;
  status: 'ready';
  fullText?: { [k: string]: string };
  generatedToc: boolean;
  toc?: TableOfContent[];
};

export type FileAttachmentDBO = BaseFileDBO & {
  type: 'attachment';
  entity: string;
  url?: never;
};

export type URLAttachmentDBO = BaseFileDBO & {
  type: 'attachment';
  entity: string;
  url: string;
};

export type CustomDBO = BaseFileDBO & {
  type: 'custom';
};

export type ThumbnailDBO = BaseFileDBO & {
  entity: string;
  language: LanguageISO6393;
  type: 'thumbnail';
};

export type fileDBO =
  | ProcessingPDFDBO
  | ProcessedPDFDBO
  | FileAttachmentDBO
  | CustomDBO
  | ThumbnailDBO
  | URLAttachmentDBO;
