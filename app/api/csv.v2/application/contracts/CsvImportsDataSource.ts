import { ResultType } from '#api/core/libs/Result.js';
import { CsvImportDoesNotExistError } from '#api/csv.v2/domain/csvImporErrors.js';
import { CsvImport } from '../../domain/CsvImport.js';

export interface CsvImportsDataSource {
  insert(doc: CsvImport): Promise<void>;
  update(doc: CsvImport): Promise<void>;
  getById(importId: string): Promise<ResultType<CsvImport, CsvImportDoesNotExistError>>;
}
