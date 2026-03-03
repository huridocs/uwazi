import { DomainError } from '#api/core/domain/error/DomainError.js';

export class CsvImportDoesNotExistError extends DomainError {
  constructor(importId: string) {
    super(
      `The CSV Import with Id "${importId}" was not found.`,
      'csv.import.csv_import_does_not_exist_error'
    );
  }
}
