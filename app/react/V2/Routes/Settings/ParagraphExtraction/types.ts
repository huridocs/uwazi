export type ParagraphExtractorValues = {
  _id?: string;
  templatesFrom: string[];
  templateTo: string;
};

export type Extractor = ParagraphExtractorValues & {
  documents: number;
  generatedEntities: number;
};

export type TableExtractor = Extractor & {
  rowId: string;
  targetTemplateName: string;
  originTemplateNames: string[];
};
