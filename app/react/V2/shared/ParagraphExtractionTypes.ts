type Extractor = {
  _id: string;
  sourceTemplateId: string;
  targetTemplateId: string;
  statusCount: {
    new: number;
    processing: number;
    obsolete: number;
    error: number;
    processed: number;
    total: number;
  };
};

export type { Extractor };
