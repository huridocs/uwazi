import { Extractor } from 'V2/shared/ParagraphExtractionTypes';

type PXTemplate = {
  _id: string;
  name: string;
  color?: string;
};

type ParagraphExtractorApiPayload = {
  _id?: string;
  sourceTemplateId: string;
  targetTemplateId: string;
  paragraphPropertyId: string;
  paragraphNumberPropertyId: string;
  targetRelationshipId: string;
  sourceRelationshipId: string;
};

type PXTable = Extractor & {
  rowId: string;
  targetTemplate: PXTemplate;
  sourceTemplate: PXTemplate;
};

type EntityStatus = 'NEW' | 'IN_QUEUE' | 'PROCESSING' | 'DONE' | 'HAS_ERROR';

type PXEntityApiResponse = {
  _id: string;
  title: string;
  templateId: string;
  document: string;
  languages: string[];
  paragraphCount: number;
  status: EntityStatus;
};

type PXEntityTable = PXEntityApiResponse & {
  rowId: string;
  template: PXTemplate;
};

type PXParagraphApiResponse = {
  _id: string;
  title: string;
  templateId: string;
  document: string;
  languages: string[];
  paragraphCount: number;
  versions: {
    [key: string]: string;
  };
};

type PXEntityQuery = {
  filter: {
    extractorId: string;
    status?: string[];
    languages?: string[];
  };
  page?: {
    number: number;
    size: number;
  };
  sort?: {
    property: string;
    order?: 'asc' | 'desc';
  };
  [k: string]: unknown | undefined;
};

type PXParagraphTable = PXParagraphApiResponse & {
  rowId: string;
  template: PXTemplate;
  text: string;
  subRows?: any[];
};

export type {
  PXTemplate,
  EntityStatus,
  ParagraphExtractorApiPayload,
  PXEntityApiResponse,
  PXTable,
  PXEntityTable,
  PXParagraphApiResponse,
  PXEntityQuery,
  PXParagraphTable,
};
