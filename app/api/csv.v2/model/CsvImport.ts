export type CsvImportStatus =
  | 'queued'
  | 'validating'
  | 'extracting files'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type CsvImportStorage = {
  path: string;
  provider?: string;
  etag?: string;
  checksum?: string;
};

export type CsvImportToCreate = {
  templateId: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  status: CsvImportStatus;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
};

export type CsvImport = CsvImportToCreate & {
  id: string;
  storage?: CsvImportStorage;
  rowErrors?: any; // intentionally flexible for MVP
};
