import { ResultType } from '#api/core/libs/Result.js';
import { CsvImportDoesNotExistError } from '../../domain/csvImporErrors.js';
import { CsvImport } from '../../domain/CsvImport.js';

export interface CsvImportEntitiesImportsDataSource {
  getAll(): Promise<CsvImport[]>;
  getById(importId: string): Promise<ResultType<CsvImport, CsvImportDoesNotExistError>>;
  cancel(importId: string): Promise<void>;
}
