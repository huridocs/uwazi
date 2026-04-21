import { CsvImportFileNotFoundErrorParams } from './CsvImportRowProcessingErrorTypes.js';

class CsvImportFileNotFoundError extends Error {
  readonly importId: string;

  readonly filename: string;

  readonly column: 'file' | 'files' | 'attachments';

  readonly cause?: unknown;

  constructor(params: CsvImportFileNotFoundErrorParams) {
    super(`CSV import missing file "${params.filename}" for import ${params.importId}`);
    this.name = 'CsvImportFileNotFoundError';
    this.importId = params.importId;
    this.filename = params.filename;
    this.column = params.column;
    this.cause = params.cause;
  }
}

export { CsvImportFileNotFoundError };
