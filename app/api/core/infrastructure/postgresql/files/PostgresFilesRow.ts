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
  creation_date: number;
  type: 'custom' | 'document' | 'thumbnail' | 'attachment';
  entity: string | null;
  status: 'processing' | 'failed' | 'ready' | null;
  total_pages: number | null;
  language: LanguageISO6393 | null;
  generated_toc: boolean | null;
  url: string | null;
  toc: TableOfContent[] | null;
  property_selections: PropertySelectionSchema[] | null;
  full_text: Record<string, string> | null;
};

export type { FilesRow };
