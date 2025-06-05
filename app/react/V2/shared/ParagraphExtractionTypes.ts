import { ClientEntitySchema } from 'app/istore';

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
  paragraphNumberPropertyId: string;
  paragraphPropertyId: string;
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

type PXEntityRow = {
  entity: ClientEntitySchema;
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

type PXEntityParagraphAPIRow = { sharedId: string; entities: ClientEntitySchema[] };
type PXParagraphAPIResponse = {
  page: {
    number: number;
    size: number;
  };
  totalRows: number;
  rows?: PXEntityParagraphAPIRow[];
};

type TablePXEntityParagraphRow = {
  sharedId: string;
  rowId: string;
  title: string;
  language: string;
  template: string;
  paragraphNumber: number;
  paragraphText: string;
  subRows?: Omit<TablePXEntityParagraphRow, 'entities'>[];
  _id: string;
};

type PXParagraphLoaderResponse = {
  page: {
    number: number;
    size: number;
  };
  totalRows: number;
  rows?: TablePXEntityParagraphRow[];
  extractor?: Extractor;
  sourceEntity?: ClientEntitySchema;
};

export type {
  Extractor,
  PXEntityQuery,
  PXEntityRows,
  PXEntityLoaderResponse,
  TablePXEntityRow,
  PXParagraphQuery,
  PXEntityParagraphAPIRow,
  TablePXEntityParagraphRow,
  PXParagraphAPIResponse,
  PXParagraphLoaderResponse,
};

export { EntityStatus };
