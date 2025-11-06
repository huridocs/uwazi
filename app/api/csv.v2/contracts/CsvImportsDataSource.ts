import { CsvImport, CsvImportStorage } from '../model/CsvImport';

export interface CsvImportsDataSource {
  insert(doc: Omit<CsvImport, 'id'>): Promise<CsvImport>;
  setStorage(importId: string, storage: CsvImportStorage): Promise<void>;
  getById(importId: string): Promise<CsvImport | undefined>;
}
