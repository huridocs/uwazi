export type PXTemplate = {
  _id: string;
  name: string;
  color?: string;
};

export type ParagraphExtractorApiPayload = {
  _id?: string;
  sourceTemplateId: string;
  targetTemplateId: string;
};

export type ParagraphExtractorApiResponse = ParagraphExtractorApiPayload & {
  documents: number;
  count: {
    generatedEntities: number;
    new: number;
  };
};

export type PXTable = ParagraphExtractorApiResponse & {
  rowId: string;
  targetTemplate: PXTemplate;
  sourceTemplate: PXTemplate;
};

export type EntityStatus = 'NEW' | 'IN_QUEUE' | 'PROCESSING' | 'DONE' | 'HAS_ERROR';

export type PXEntityApiResponse = {
  _id: string;
  title: string;
  templateId: string;
  document: string;
  languages: string[];
  paragraphCount: number;
  status: EntityStatus;
};

export type PXEntityTable = PXEntityApiResponse & {
  rowId: string;
  template: PXTemplate;
};

export type PXParagraphApiResponse = {
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

export type PXEntityQuery = {
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

export type PXParagraphTable = PXParagraphApiResponse & {
  rowId: string;
  template: PXTemplate;
  text: string;
  subRows?: any[];
};
