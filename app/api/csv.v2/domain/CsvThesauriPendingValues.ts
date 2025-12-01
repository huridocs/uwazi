import { CsvThesauriPendingChild } from './CsvThesauriPendingChild';
import { CsvThesauriPendingEntry } from './CsvThesauriPendingEntry';
import { CsvThesauriPendingRoot } from './CsvThesauriPendingRoot';

type CsvThesauriPendingValuesProps = {
  importId: string;
  createdAt: number;
  defaultLanguage: string;
  entries: CsvThesauriPendingEntry[];
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
      entries: this.entries.map(entry => entry.toPersistence()),
    };
  }
}

type CsvThesauriPendingIssue = {
  property: string;
  reason: string;
  value?: string;
  row?: number;
  type: 'parse' | 'translation' | 'conflict';
};

export type { CsvThesauriPendingIssue };
export {
  CsvThesauriPendingChild,
  CsvThesauriPendingEntry,
  CsvThesauriPendingRoot,
  CsvThesauriPendingValues,
};
