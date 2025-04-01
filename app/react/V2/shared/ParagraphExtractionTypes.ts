type EntityStatus = 'NEW' | 'IN_QUEUE' | 'PROCESSING' | 'DONE' | 'HAS_ERROR';

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

type PXEntityQuery = {
  filter: {
    extractorId: string;
    status?: string[];
    languages?: string[];
  };
  page?: {
    number: number;
    size: number;
  };
};

type PXEntityRows = {
  rows: {
    entity: {
      _id: string;
      sharedId: string;
      title: string;
      language: string;
    };
    status: {
      _id: string;
      status: EntityStatus;
    };
    availableFileLanguages: string[];
    paragraphsCount: number;
  };
  page: {
    number: number;
    size: number;
  };
  totalRows: number;
};

export type { Extractor, PXEntityQuery, PXEntityRows, EntityStatus };
