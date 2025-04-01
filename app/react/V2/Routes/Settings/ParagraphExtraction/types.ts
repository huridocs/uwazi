import { Extractor, EntityStatus } from 'V2/shared/ParagraphExtractionTypes';

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
  relationshipId: string;
};

type PXTable = Extractor & {
  rowId: string;
  targetTemplate: PXTemplate;
  sourceTemplate: PXTemplate;
};

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
  PXParagraphTable,
};
