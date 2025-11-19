import { CsvThesauriPlanEntry } from './CsvThesauriPlan';

export type CsvImportThesauriValues = {
  importId: string;
  thesaurusId: string;
  entries: CsvThesauriPlanEntry[];
  createdAt: number;
};

