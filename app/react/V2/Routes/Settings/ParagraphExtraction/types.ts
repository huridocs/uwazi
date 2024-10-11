export type ParagraphExtractorApiPayload = {
  _id?: string;
  templatesFrom: string[];
  templateTo: string;
};

export type ParagraphExtractorApiResponse = ParagraphExtractorApiPayload & {
  documents: number;
  generatedEntities: number;
};

export type TableParagraphExtractor = ParagraphExtractorApiResponse & {
  rowId: string;
  targetTemplateName: string;
  originTemplateNames: string[];
};
