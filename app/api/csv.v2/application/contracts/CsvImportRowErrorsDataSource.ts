import { CsvImportRowError } from '../../domain/CsvImportRowError';

export interface CsvImportRowErrorsDataSource {
  insertMany(errors: CsvImportRowError[]): Promise<void>;
  countByImport(importId: string): Promise<number>;
  getByImport(importId: string): Promise<CsvImportRowError[]>;
  deleteByImport(importId: string): Promise<void>;
}
