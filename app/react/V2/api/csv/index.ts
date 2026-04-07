import { IncomingHttpHeaders } from 'http';
import { api } from '#app/utils/api.js';
import { RequestParams } from '#app/utils/RequestParams.js';

enum CsvImportStatus {
  Queued = 'queued',
  Validating = 'validating',
  ExtractingFiles = 'extracting files',
  ExtractingFilesDone = 'extracting files:done',
  PreflightScan = 'preflight:scan',
  PreflightScanDone = 'preflight:scan:done',
  PreflightThesauriCreate = 'preflight:thesauri:create',
  PreflightThesauriCreateDone = 'preflight:thesauri:create:done',
  PreflightRelationshipsCreate = 'preflight:relationships:create',
  PreflightRelationshipsCreateDone = 'preflight:relationships:create:done',
  ImportEntities = 'import:entities',
  ImportEntitiesDone = 'import:entities:done',
  Retrying = 'retrying',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

type CsvImportProgress = {
  totalRows: number;
  processedRows: number;
  lastProcessedRow: number;
  batchSize: number;
};

type CsvImportStats = {
  thesaurusValuesObserved?: number;
  thesaurusValuesCreated?: number;
  thesauriTouched?: number;
  relationshipValuesObserved?: number;
  relationshipValuesCreated?: number;
  entitiesCreated?: number;
  rowsProcessed?: number;
  rowsFailed?: number;
};

type CsvImportExtractionFile = {
  filename: string;
  sizeBytes: number;
  compressedSizeBytes?: number;
};

type CsvImportExtraction = {
  sourceType: 'zip' | 'csv';
  originalUploadSizeBytes: number;
  extractedFilesCount: number;
  totalFilesInZip?: number;
  files: CsvImportExtractionFile[];
};

type CsvImportFailure = {
  message: string;
  retryable: boolean;
  at: number;
  stage: string;
  code?: string;
};

type CsvImportListRow = {
  id: string;
  status: CsvImportStatus;
  templateId: string;
  file: {
    originalName: string;
    mimeType: string;
    size: number;
  };
  createdAt: number;
  updatedAt: number;
  progress?: CsvImportProgress;
  stats?: CsvImportStats;
  extraction?: CsvImportExtraction;
  failure?: CsvImportFailure;
};

type CsvImportsList = {
  rows: CsvImportListRow[];
};

const get = async (headers?: IncomingHttpHeaders) => {
  const requestParams = new RequestParams(undefined, headers);
  const response = (await api.get('csvImportEntities/imports', requestParams)) as {
    json: CsvImportsList;
  };

  return response.json.rows;
};

export type { CsvImportListRow };
export { CsvImportStatus, get };
