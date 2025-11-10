import { ObjectId } from 'mongodb';
import { LanguageISO6393 } from 'shared/language/languageISO639_3';

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

export type DocumentDBO = BaseDocument & {
  status: 'processing' | 'failed';
};

export type ProcessedDocumentDBO = BaseDocument & {
  totalPages: number;
  language: LanguageISO6393;
  status: 'ready';
  fullText?: { [k: string]: string };
};

export type AttachmentDBO = BaseFileDBO & {
  type: 'attachment';
  entity: string;
  url?: string;
};

export type CustomDBO = BaseFileDBO & {
  type: 'custom';
};

export type ThumbnailDBO = BaseFileDBO & {
  entity: string;
  language: LanguageISO6393;
  type: 'thumbnail';
};

export type fileDBO = DocumentDBO | ProcessedDocumentDBO | AttachmentDBO | CustomDBO | ThumbnailDBO;
