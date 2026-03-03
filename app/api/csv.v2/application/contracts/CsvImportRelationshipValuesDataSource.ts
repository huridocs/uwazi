import { CsvImportRelationshipValues } from '../../domain/CsvImportRelationshipValues.js';

export interface CsvImportRelationshipValuesDataSource {
  replaceValues(importId: string, docs: CsvImportRelationshipValues[]): Promise<void>;
  getByImport(importId: string): Promise<CsvImportRelationshipValues[]>;
}
