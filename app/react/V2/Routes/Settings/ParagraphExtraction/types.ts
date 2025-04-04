import { ClientEntitySchema } from 'app/istore';
import {
  Extractor,
  EntityStatus,
  PXParagraphApiResponse,
} from 'V2/shared/ParagraphExtractionTypes';

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

type TableEntity = ClientEntitySchema & {
  rowId: string;
  title: string;
  language: string;
  _id: string;
};

type PXParagraphsLoaderResponse = {
  paragraphs: {
    sharedId: string;
    subRows: TableEntity[];
    title: string;
    language: string;
    rowId: string;
  }[];
  sourceTemplateId: string;
  page: PXParagraphApiResponse['page'];
  totalRows: PXParagraphApiResponse['totalRows'];
};

export type {
  PXTemplate,
  EntityStatus,
  ParagraphExtractorApiPayload,
  PXTable,
  PXParagraphsLoaderResponse,
};
