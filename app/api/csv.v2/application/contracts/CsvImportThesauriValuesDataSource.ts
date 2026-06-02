import {
  CsvImportThesauriAppliedValue,
  CsvImportThesauriStats,
  CsvImportThesauriValues,
} from '../../domain/CsvImportThesauriValues.js';

export interface CsvImportThesauriValuesDataSource {
  replacePendingValues(importId: string, pendingValues: CsvImportThesauriValues[]): Promise<void>;
  getByImport(importId: string): Promise<CsvImportThesauriValues[]>;
  deleteByImport(importId: string): Promise<void>;
  markAsApplied(input: {
    importId: string;
    thesaurusId: string;
    appliedAt: number;
    appliedValues: CsvImportThesauriAppliedValue[];
    stats: CsvImportThesauriStats;
  }): Promise<void>;
}
