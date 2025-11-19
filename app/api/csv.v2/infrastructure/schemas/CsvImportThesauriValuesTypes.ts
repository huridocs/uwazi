import { CsvThesauriPlanEntry } from '../../domain/CsvThesauriPlan';

export interface CsvImportThesauriValuesDBO {
  importId: string;
  thesaurusId: string;
  createdAt: number;
  entries: CsvThesauriPlanEntry[];
}

