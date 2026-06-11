import { LanguageISO6393 } from '#shared/language/languageISO639_3.js';
import { LanguageISO6391, PropertySelectionSchema } from '#shared/types/commonTypes.js';

type BaseFileDTO = {
  _id: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  creationDate: number;
};

export type TableOfContent = {
  selectionRectangles?: {
    top: number;
    left: number;
    width: number;
    height: number;
    page?: string;
  }[];
  label?: string;
  indentation?: number;
};

export type FullText = Record<string, string>;

export type FileUpdateInput = {
  originalname?: string;
  language?: LanguageISO6391;
  toc?: TableOfContent[];
  generatedToc?: boolean;
  propertySelections?: PropertySelectionSchema[];
};

export type PDFDocumentDTO = BaseFileDTO &
  (
    | {
        type: 'document';
        status: 'processing' | 'failed';
        entity: string;
        propertySelections?: PropertySelectionSchema[];
      }
    | {
        type: 'document';
        status: 'ready';
        entity: string;
        language: LanguageISO6393;
        totalPages: number;
        generatedToc: boolean;
        toc?: TableOfContent[];
        fullText?: FullText;
        propertySelections?: PropertySelectionSchema[];
      }
  );

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
  | PDFDocumentDTO
  | FileAttachmentDTO
  | URLAttachmentDTO
  | ThumbnailDTO
  | CustomDTO;
