type CsvThesauriPendingChild = {
  label: string;
  normalized: string;
  languages: Record<string, string>;
};

type CsvThesauriPendingRoot = {
  label: string;
  normalized: string;
  languages: Record<string, string>;
  children: CsvThesauriPendingChild[];
};

type CsvThesauriPendingEntry = {
  propertyId: string;
  propertyName: string;
  thesaurusId: string;
  type: 'select' | 'multiselect';
  roots: CsvThesauriPendingRoot[];
};

export type CsvThesauriPendingValues = {
  importId: string;
  createdAt: number;
  defaultLanguage: string;
  entries: CsvThesauriPendingEntry[];
};

export type CsvThesauriPendingIssue = {
  property: string;
  reason: string;
  value?: string;
  row?: number;
  type: 'parse' | 'translation' | 'conflict';
};

export type { CsvThesauriPendingEntry, CsvThesauriPendingRoot, CsvThesauriPendingChild };
