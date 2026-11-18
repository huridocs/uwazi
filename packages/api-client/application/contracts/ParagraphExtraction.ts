import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { EntitySchema } from '#shared/types/entityType.js';

type PXEntityStatus = 'new' | 'processing' | 'obsolete' | 'error' | 'processed';

type PXPage = { number?: number; size?: number };

/** GET /api/paragraphExtraction/extractors (admins and editors, behind the feature flag) */
type PXExtractorsResponse = {
  _id: string;
  sourceTemplateId: string;
  targetTemplateId: string;
  paragraphNumberPropertyId: string;
  paragraphPropertyId: string;
  statusCount: Record<PXEntityStatus | 'total', number>;
}[];

/** GET /api/paragraphExtraction/extractorStatuses */
type PXExtractorStatusesQuery = {
  id: string;
  page?: PXPage;
  filter?: { status?: PXEntityStatus[] };
};

type PXExtractorStatusesResponse = {
  rows: {
    entity: { _id: string; sharedId: string; title: string; language: LanguageISO6391 };
    status: { _id: string; status: PXEntityStatus };
    availableFileLanguages: LanguageISO6391[];
    paragraphsCount: number;
  }[];
  page: { number: number; size: number };
  totalRows: number;
};

/** GET /api/paragraphExtraction/entityParagraphs */
type PXEntityParagraphsQuery = { id: string; extractorId: string; page?: PXPage };

type PXEntityParagraphsResponse = {
  rows: { sharedId: string; entities: EntitySchema[] }[];
  page: { number: number; size: number };
  totalRows: number;
};

export type {
  PXEntityStatus,
  PXExtractorsResponse,
  PXExtractorStatusesQuery,
  PXExtractorStatusesResponse,
  PXEntityParagraphsQuery,
  PXEntityParagraphsResponse,
};
