import { CsvThesauriPendingEntry } from '../../domain/CsvThesauriPendingValues.js';

export interface CsvImportThesauriValuesDBO {
  importId: string;
  thesaurusId: string;
  createdAt: number;
  entries: CsvThesauriPendingEntry[];
  appliedAt?: number;
  appliedValues?: Array<{ label: string; parentLabel?: string; valueId: string }>;
  stats?: {
    valuesObserved: number;
    valuesCreated: number;
  };
}
