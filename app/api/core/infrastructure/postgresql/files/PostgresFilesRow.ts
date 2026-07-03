import type { LanguageISO6393 } from '#shared/language/languageISO639_3.js';
import type { PropertySelectionSchema } from '#shared/types/commonTypes.js';
import type { TableOfContent } from '#api/core/domain/files/domainTypes.js';

type FilesRow = {
  _id: string;
  tenant_id: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  creationDate: number;
  type: 'custom' | 'document' | 'thumbnail' | 'attachment';
  entity: string | null;
  status: 'processing' | 'failed' | 'ready' | null;
  totalPages: number | null;
  language: LanguageISO6393 | null;
  generatedToc: boolean | null;
  url: string | null;
  toc: TableOfContent[] | null;
  propertySelections: PropertySelectionSchema[] | null;
  fullText: Record<string, string> | null;
};

export type { FilesRow };
