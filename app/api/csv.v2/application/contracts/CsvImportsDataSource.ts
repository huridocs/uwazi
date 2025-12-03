import { ResultType } from 'api/core/libs/Result';
import { CsvImportDoesNotExistError } from 'api/csv.v2/domain/csvImporErrors';
import { CsvImport } from '../../domain/CsvImport';

export interface CsvImportsDataSource {
  insert(doc: CsvImport): Promise<void>;
  update(doc: CsvImport): Promise<void>;
  getById(importId: string): Promise<ResultType<CsvImport, CsvImportDoesNotExistError>>;
}
