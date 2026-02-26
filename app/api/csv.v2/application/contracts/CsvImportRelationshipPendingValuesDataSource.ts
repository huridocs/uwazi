import { CsvImportRelationshipPendingValues } from '../../domain/CsvImportRelationshipPendingValues.js';

export interface CsvImportRelationshipPendingValuesDataSource {
  replacePendingValues(importId: string, docs: CsvImportRelationshipPendingValues[]): Promise<void>;
  getByImport(importId: string): Promise<CsvImportRelationshipPendingValues[]>;
}
