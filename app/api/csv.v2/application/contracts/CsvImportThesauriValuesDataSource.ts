import { CsvThesauriPlanEntry } from '../../domain/CsvThesauriPlan';
import { CsvImportThesauriValues } from '../../domain/CsvImportThesauriValues';

export interface CsvImportThesauriValuesDataSource {
  replacePlan(
    importId: string,
    entries: CsvThesauriPlanEntry[],
    createdAt: number
  ): Promise<void>;
  getByImport(importId: string): Promise<CsvImportThesauriValues[]>;
  deleteByImport(importId: string): Promise<void>;
}

