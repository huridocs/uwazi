// eslint-disable-next-line max-classes-per-file
import { DomainError } from '#api/core/domain/error/DomainError.js';

export class CsvImportDoesNotExistError extends DomainError {
  constructor(importId: string) {
    super(
      `The CSV Import with Id "${importId}" was not found.`,
      'csv.import.csv_import_does_not_exist_error'
    );
  }
}

export class CsvImportFailedRowsCsvDoesNotExistError extends DomainError {
  constructor(importId: string) {
    super(
      `The CSV Import with Id "${importId}" does not have a failed rows CSV report.`,
      'csv.import.csv_import_failed_rows_csv_does_not_exist_error'
    );
  }
}
