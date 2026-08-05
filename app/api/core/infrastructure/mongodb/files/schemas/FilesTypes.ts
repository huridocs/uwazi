/* eslint-disable import/exports-last */
import { ObjectId } from 'mongodb';
import { LanguageISO6393 } from '#shared/language/languageISO639_3.js';
import type { PropertySelectionSchema } from '#shared/types/commonTypes.js';
import type { TableOfContent } from '#api/core/domain/files/domainTypes.js';

export type {
  PDFDocumentDTO,
  FileAttachmentDTO,
  URLAttachmentDTO,
  ThumbnailDTO,
  CustomDTO,
} from '#api/core/domain/files/domainTypes.js';

type BaseFields = {
  _id: ObjectId;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  creationDate: number;
  type: 'custom' | 'document' | 'thumbnail' | 'attachment';
};

// ── Specialized types ────────────────────────────────────────────────────────
type ProcessingPDFFields = {
  type: 'document';
  entity: string;
  status: 'processing' | 'failed';
};

type ProcessedPDFFields = {
  type: 'document';
  entity: string;
  status: 'ready';
  totalPages: number;
  language: LanguageISO6393;
  generatedToc: boolean;
  toc?: TableOfContent[];
  fullText?: Record<string, string>;
  propertySelections?: PropertySelectionSchema[];
};

type FileAttachmentFields = {
  type: 'attachment';
  entity: string;
};

type URLAttachmentFields = {
  type: 'attachment';
  entity: string;
  url: string;
};

type CustomFields = {
  type: 'custom';
};

type ThumbnailFields = {
  type: 'thumbnail';
  entity: string;
  language: LanguageISO6393;
};

// ── Public specialized DBOs (Base + Fields) ───────────────────────────────────
export type ProcessingPDFDBO = BaseFields & ProcessingPDFFields;
export type ProcessedPDFDBO = BaseFields & ProcessedPDFFields;
export type PDFDocumentDBO = ProcessingPDFDBO | ProcessedPDFDBO;

export type FileAttachmentDBO = BaseFields & FileAttachmentFields;
export type URLAttachmentDBO = BaseFields & URLAttachmentFields;

export type CustomDBO = BaseFields & CustomFields;
export type ThumbnailDBO = BaseFields & ThumbnailFields;

// ── FileDBO derived from all specialized types ────────────────────────────────

type AllSpecializedFields =
  | ProcessingPDFFields
  | ProcessedPDFFields
  | FileAttachmentFields
  | URLAttachmentFields
  | CustomFields
  | ThumbnailFields;

type AllKeysOfUnion<T> = T extends unknown ? keyof T : never;

type ValueFromUnion<T, K extends AllKeysOfUnion<T>> = T extends { [P in K]?: infer V | undefined }
  ? V
  : never;

type MergedSpecializedFields = {
  [K in AllKeysOfUnion<AllSpecializedFields>]: ValueFromUnion<AllSpecializedFields, K>;
};

export type FileDBO = BaseFields & Partial<Omit<MergedSpecializedFields, 'type'>>;
