type CsvThesauriPlanChild = {
  label: string;
  normalized: string;
  languages: Record<string, string>;
};

type CsvThesauriPlanRoot = {
  label: string;
  normalized: string;
  languages: Record<string, string>;
  children: CsvThesauriPlanChild[];
};

type CsvThesauriPlanEntry = {
  propertyId: string;
  propertyName: string;
  thesaurusId: string;
  type: 'select' | 'multiselect';
  roots: CsvThesauriPlanRoot[];
};

export type CsvThesauriPlan = {
  importId: string;
  createdAt: number;
  defaultLanguage: string;
  entries: CsvThesauriPlanEntry[];
};

export type CsvThesauriPlanIssue = {
  property: string;
  reason: string;
  value?: string;
  row?: number;
  type: 'parse' | 'translation' | 'conflict';
};

export type { CsvThesauriPlanEntry, CsvThesauriPlanRoot, CsvThesauriPlanChild };
