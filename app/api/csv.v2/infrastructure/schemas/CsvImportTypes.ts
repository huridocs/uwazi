export interface CsvImportDBO {
  _id?: any;
  templateId: string;
  file: {
    originalName: string;
    mimeType: string;
    size: number;
  };
  storage?: {
    path: string;
    provider?: string;
    etag?: string;
    checksum?: string;
  };
  status: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  rowErrors?: any;
  failure?: {
    message: string;
    retryable: boolean;
    at: number;
    stage: string;
    code?: string;
    issues?: Array<{
      reason: string;
      message: string;
      property?: string;
      columns?: string[];
    }>;
  };
  stats?: {
    thesaurusValuesObserved?: number;
    thesaurusValuesCreated?: number;
    thesauriTouched?: number;
    entitiesCreated?: number;
    rowsProcessed?: number;
    rowsFailed?: number;
  };
  progress?: {
    totalRows: number;
    processedRows: number;
    lastProcessedRow: number;
    batchSize: number;
  };
  extraction?: {
    sourceType: 'zip' | 'csv';
    originalUploadSizeBytes: number;
    extractedFilesCount: number;
    totalFilesInZip?: number;
    files: Array<{
      filename: string;
      sizeBytes: number;
      compressedSizeBytes?: number;
    }>;
  };
}
