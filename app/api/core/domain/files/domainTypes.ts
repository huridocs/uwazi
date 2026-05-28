import { LanguageISO6393 } from '#shared/language/languageISO639_3.js';
import type { FullText, TableOfContent } from './ProcessedPDF.js';

type BaseFileDTO = {
  _id: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  creationDate: number;
};

export type ProcessingPDFDTO = BaseFileDTO & {
  type: 'document';
  status: 'processing' | 'failed';
  entity: string;
};

export type ProcessedPDFDTO = BaseFileDTO & {
  type: 'document';
  status: 'ready';
  entity: string;
  language: LanguageISO6393;
  totalPages: number;
  generatedToc: boolean;
  toc?: TableOfContent[];
  fullText?: FullText;
};

export type FileAttachmentDTO = BaseFileDTO & {
  type: 'attachment';
  entity: string;
};

export type URLAttachmentDTO = BaseFileDTO & {
  type: 'attachment';
  entity: string;
  url: string;
};

export type ThumbnailDTO = BaseFileDTO & {
  type: 'thumbnail';
  entity: string;
  language: LanguageISO6393;
};

export type CustomDTO = BaseFileDTO & {
  type: 'custom';
};

export type FileDTO =
  | ProcessingPDFDTO
  | ProcessedPDFDTO
  | FileAttachmentDTO
  | URLAttachmentDTO
  | ThumbnailDTO
  | CustomDTO;
