import { CsvThesauriPendingChild } from './CsvThesauriPendingChild.js';
import { CsvThesauriPendingEntry } from './CsvThesauriPendingEntry.js';
import { CsvThesauriPendingRoot } from './CsvThesauriPendingRoot.js';

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

  toObject() {
    return {
      importId: this.importId,
      createdAt: this.createdAt,
      defaultLanguage: this.defaultLanguage,
      entries: this.entries.map(entry => entry.toObject()),
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
