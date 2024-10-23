export type ParagraphExtractorApiPayload = {
  _id?: string;
  templatesFrom: string[];
  templateTo: string;
};

export type ParagraphExtractorApiResponse = ParagraphExtractorApiPayload & {
  documents: number;
  generatedEntities: number;
};

export type PXTable = ParagraphExtractorApiResponse & {
  rowId: string;
  targetTemplateName: string;
  originTemplateNames: string[];
};

//
export type PXEntityApiResponse = {
  _id: string;
  title: string;
  templateId: string;
  document: string;
  languages: string[];
  paragraphCount: number;
};

export type PXEntityTable = PXEntityApiResponse & {
  rowId: string;
  templateName: string;
};

export type PXParagraphApiResponse = {
  _id: string;
  title: string;
  templateId: string;
  document: string;
  languages: string[];
  paragraphCount: number;
  text: string;
};

export type PXParagraphTable = PXParagraphApiResponse & {
  rowId: string;
  templateName: string;
};
