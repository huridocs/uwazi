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

type CsvThesauriPendingValuesProps = {
  importId: string;
  createdAt: number;
  defaultLanguage: string;
  entries: CsvThesauriPendingEntry[];
};

type CsvThesauriPendingIssue = {
  property: string;
  reason: string;
  value?: string;
  row?: number;
  type: 'parse' | 'translation' | 'conflict';
};

class CsvThesauriPendingValues {
  readonly importId: string;

  readonly createdAt: number;

  readonly defaultLanguage: string;

  readonly entries: CsvThesauriPendingEntry[];

  private constructor(props: CsvThesauriPendingValuesProps) {
    this.importId = props.importId;
    this.createdAt = props.createdAt;
    this.defaultLanguage = props.defaultLanguage;
    this.entries = props.entries;
  }

  static create(props: CsvThesauriPendingValuesProps) {
    return new CsvThesauriPendingValues(props);
  }

  toPersistence() {
    return {
      importId: this.importId,
      createdAt: this.createdAt,
      defaultLanguage: this.defaultLanguage,
      entries: this.entries,
    };
  }
}

export type {
  CsvThesauriPendingEntry,
  CsvThesauriPendingRoot,
  CsvThesauriPendingChild,
  CsvThesauriPendingIssue,
};
export { CsvThesauriPendingValues };
