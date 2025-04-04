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

type PXParagraphsLoaderResponse = {
  paragraphs: PXParagraphApiResponse;
  templateId: string;
  propertyId: string;
};

export type {
  PXTemplate,
  EntityStatus,
  ParagraphExtractorApiPayload,
  PXTable,
  PXParagraphsLoaderResponse,
};
