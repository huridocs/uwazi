import { ResultType } from 'api/core/libs/Result';
import { CsvImportDoesNotExistError } from '../../domain/csvImporErrors';
import { CsvImport } from '../../domain/CsvImport';

export interface CsvImportEntitiesImportsDataSource {
  getAll(): Promise<CsvImport[]>;
  getById(importId: string): Promise<ResultType<CsvImport, CsvImportDoesNotExistError>>;
}
