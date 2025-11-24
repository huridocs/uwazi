import { CsvImport } from '../model/CsvImport';

export interface CsvImportsDataSource {
  insert(doc: CsvImport): Promise<void>;
  update(doc: CsvImport): Promise<void>;
  getById(importId: string): Promise<CsvImport | undefined>;
}
