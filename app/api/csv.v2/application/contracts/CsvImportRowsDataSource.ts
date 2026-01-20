import { CsvImportRow } from '#api/csv.v2/domain/CsvImportRow.js';

export interface CsvImportRowsDataSource {
  insertMany(rows: CsvImportRow[]): Promise<void>;
  countByImport(importId: string): Promise<number>;
  getByImport(importId: string, offset?: number, limit?: number): Promise<CsvImportRow[]>;
  deleteByImport(importId: string): Promise<void>;
}
