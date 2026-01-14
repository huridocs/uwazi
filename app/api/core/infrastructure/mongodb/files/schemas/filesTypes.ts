import { ObjectId } from 'mongodb';
import { LanguageISO6393 } from 'shared/language/languageISO639_3';

/**
 * Transforms DBO types (with ObjectId _id) to DTO types (with string _id).
 * Uses distributive conditional type to preserve union structure.
 *
 * @example
 * type DocumentDTO = ToDTO<DocumentDBO>
 * // Result: { _id: string, ...rest of DocumentDBO fields }
 */
type ToDTO<T> = T extends any ? Omit<T, '_id'> & { _id: string } : never;

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

export type ProcessingPDFDTO = ToDTO<ProcessingPDFDBO>;
export type ProcessedPDFDTO = ToDTO<ProcessedPDFDBO>;
export type FileAttachmentDTO = ToDTO<FileAttachmentDBO>;
export type URLAttachmentDTO = ToDTO<URLAttachmentDBO>;
export type CustomDTO = ToDTO<CustomDBO>;
export type ThumbnailDTO = ToDTO<ThumbnailDBO>;

export type fileDTO =
  | ProcessingPDFDTO
  | ProcessedPDFDTO
  | FileAttachmentDTO
  | URLAttachmentDTO
  | CustomDTO
  | ThumbnailDTO;
