import { Extractor, EntityStatus } from '#shared/ParagraphExtractionTypes.js';

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

export type { PXTemplate, EntityStatus, ParagraphExtractorApiPayload, PXTable };
