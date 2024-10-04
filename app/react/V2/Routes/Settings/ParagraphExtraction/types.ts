export type Extractor = {
  _id: string;
  templateFrom: string[];
  templateTo: string;
  documents: number;
  generatedEntities: number;
};

export type TableExtractor = Extractor & {
  rowId: string;
  targetTemplateName: string;
  originTemplateNames: string[];
};
