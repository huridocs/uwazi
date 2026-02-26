import { CsvImportRelationshipPendingValues } from '../../domain/CsvImportRelationshipPendingValues';

export interface CsvImportRelationshipPendingValuesDataSource {
  replacePendingValues(importId: string, docs: CsvImportRelationshipPendingValues[]): Promise<void>;
  getByImport(importId: string): Promise<CsvImportRelationshipPendingValues[]>;
}
