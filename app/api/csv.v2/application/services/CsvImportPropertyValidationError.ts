import { CsvImportPropertyValidationErrorParams } from './CsvImportRowProcessingErrorTypes.js';

class CsvImportPropertyValidationError extends Error {
  readonly property: string;

  readonly column?: string;

  readonly rawValue?: string;

  readonly cause?: unknown;

  constructor(params: CsvImportPropertyValidationErrorParams) {
    super(`CSV import invalid value for property "${params.property}"`, {
      cause: params.cause instanceof Error ? params.cause : undefined,
    });
    this.name = 'CsvImportPropertyValidationError';
    this.property = params.property;
    this.column = params.column;
    this.rawValue = params.rawValue;
    this.cause = params.cause;
  }
}

export { CsvImportPropertyValidationError };
