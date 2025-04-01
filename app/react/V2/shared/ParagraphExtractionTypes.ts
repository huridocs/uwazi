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
  id: string;
  filter: {
    status?: string[];
  };
  page?: {
    number: number;
    size: number;
  };
};

type PXEntityRow = {
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

type PXEntityRows = {
  rows: PXEntityRow[];
  page: {
    number: number;
    size: number;
  };
  totalRows: number;
};

type TablePXEntityRow = PXEntityRow & { rowId: string };

type PXEntityLoaderResponse = {
  rows: TablePXEntityRow[];
  filters: { [key: string]: number };
  page: PXEntityRows['page'];
  totalRows: number;
  extractor?: Extractor;
};

export type {
  Extractor,
  PXEntityQuery,
  PXEntityRows,
  EntityStatus,
  PXEntityLoaderResponse,
  TablePXEntityRow,
};
