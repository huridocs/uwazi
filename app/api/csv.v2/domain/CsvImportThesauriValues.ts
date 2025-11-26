import { CsvThesauriPendingEntry } from './CsvThesauriPendingValues';

export type CsvImportThesauriAppliedValue = {
  label: string;
  parentLabel?: string;
  valueId: string;
};

export type CsvImportThesauriStats = {
  valuesObserved: number;
  valuesCreated: number;
};

export type CsvImportThesauriValues = {
  importId: string;
  thesaurusId: string;
  entries: CsvThesauriPendingEntry[];
  createdAt: number;
  appliedAt?: number;
  appliedValues?: CsvImportThesauriAppliedValue[];
  stats?: CsvImportThesauriStats;
};
