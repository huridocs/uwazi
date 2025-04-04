enum EntityStatus {
  New = 'new',
  Processing = 'processing',
  Obsolete = 'obsolete',
  Error = 'error',
  Processed = 'processed',
}

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
  filter?: {
    status?: string[];
  };
  page?: {
    number: number;
    size: number;
  };
};

type PXEntity = {
  _id: string;
  sharedId: string;
  title: string;
  language: string;
  templateId?: string;
  metadata?: { value: string; label: string }[];
};

type PXEntityRow = {
  entity: PXEntity;
  status: {
    _id: string;
    status: EntityStatus;
  };
  availableFileLanguages: string[];
  paragraphsCount: number;
};

type PXEntityRows = {
  page: {
    number: number;
    size: number;
  };
  totalRows: number;
  rows?: PXEntityRow[];
};

type TablePXEntityRow = PXEntityRow & { rowId: string };

type PXEntityLoaderResponse = {
  rows: TablePXEntityRow[];
  page: PXEntityRows['page'];
  totalRows: number;
  extractor?: Extractor;
};

type PXParagraphQuery = {
  id: string;
  extractorId: string;
  page?: {
    number: number;
    size: number;
  };
};

type PXEntityParagraphRow = { sharedId: string; entities: PXEntity[] };
type TablePXEntityParagraphRow = PXEntityParagraphRow & { rowId: string };

type PXParagraphsLoaderResponse = {
  rows: TablePXEntityParagraphRow[];
  page: {
    number: number;
    size: number;
  };
  totalRows: number;
};

export type {
  Extractor,
  PXEntityQuery,
  PXEntityRows,
  PXEntityLoaderResponse,
  TablePXEntityRow,
  PXParagraphQuery,
  PXEntityParagraphRow,
  PXParagraphsLoaderResponse,
  TablePXEntityParagraphRow,
};

export { EntityStatus };
