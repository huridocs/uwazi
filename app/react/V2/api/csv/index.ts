import { IncomingHttpHeaders } from 'http';
import superagent, { MultipartValueSingle } from 'superagent';
import { api } from '#app/utils/api.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { APIURL } from '#app/config.js';
import { FetchResponseError } from '#shared/JSONRequest.js';

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

type RowErrorCode =
  | 'ROW_EMPTY_OR_MALFORMED'
  | 'HEADER_MISSING_REQUIRED_COLUMN'
  | 'VALUE_INVALID_FORMAT'
  | 'VALUE_UNSUPPORTED_LANGUAGE_COLUMN'
  | 'THESAURUS_VALUE_NOT_FOUND'
  | 'RELATIONSHIP_NOT_FOUND'
  | 'RELATIONSHIP_AMBIGUOUS'
  | 'FILE_NOT_FOUND'
  | 'FILE_INVALID_REFERENCE'
  | 'INTERNAL_ERROR';

type RowError = {
  importId: string;
  rowIndex: number;
  message: string;
  code: RowErrorCode;
  property?: string;
  rawValue?: string;
  createdAt: number;
};

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
  rowErrors?: RowError[];
};

type CsvImportsList = {
  rows: CsvImportListRow[];
};

type RegisterCsvImportResponse = {
  id: string;
  status: 'queued';
  message: string;
};

type CsvImportCreateError = {
  error: any;
};

type CancelCsvImportResponse = {
  id: string;
  status: string;
  cancelled: boolean;
};

const create = async (
  file: File,
  template: string,
  onProgressCallback?: (completed: number) => void
): Promise<RegisterCsvImportResponse | CsvImportCreateError> => {
  try {
    const request = superagent
      .post(`${APIURL}csvImportEntities`)
      .set('Accept', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest')
      .field('template', template)
      .attach('file', file as MultipartValueSingle)
      .on('progress', event => {
        if (onProgressCallback && event.percent !== undefined) {
          onProgressCallback(Math.round(event.percent));
        }
      });

    return (await request).body;
  } catch (e) {
    return {
      error: e,
    };
  }
};

const get = async (
  headers?: IncomingHttpHeaders
): Promise<CsvImportListRow[] | FetchResponseError> => {
  try {
    const requestParams = new RequestParams(undefined, headers);
    const response = (await api.get('csvImportEntities/imports', requestParams)) as {
      json: CsvImportsList;
    };

    return response.json.rows;
  } catch (e) {
    return e;
  }
};

const getById = async (
  id: string,
  headers?: IncomingHttpHeaders
): Promise<CsvImportListRow | FetchResponseError> => {
  try {
    const requestParams = new RequestParams(undefined, headers);
    const response = (await api.get(`csvImportEntities/imports/${id}`, requestParams)) as {
      json: CsvImportListRow;
    };

    return response.json;
  } catch (e) {
    return e;
  }
};

const cancel = async (
  id: string,
  headers?: IncomingHttpHeaders
): Promise<CancelCsvImportResponse | FetchResponseError> => {
  try {
    const requestParams = new RequestParams(undefined, headers);
    const response = (await api.post(`csvImportEntities/imports/${id}/cancel`, requestParams)) as {
      json: CancelCsvImportResponse;
    };

    return response.json;
  } catch (e) {
    return e;
  }
};

export type {
  CsvImportListRow,
  CancelCsvImportResponse,
  RegisterCsvImportResponse,
  CsvImportCreateError,
  RowError,
};
export { CsvImportStatus, create, get, getById, cancel };
