import { CsvImport, CsvImportStorage, CsvImportToCreate } from '../model/CsvImport';

export interface CsvImportsDataSource {
  create(doc: CsvImportToCreate): Promise<CsvImport>;
  setStorage(importId: string, storage: CsvImportStorage): Promise<void>;
  getById(importId: string): Promise<CsvImport | undefined>;
}
