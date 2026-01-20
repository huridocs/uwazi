import { CsvThesauriPendingRoot } from '#api/csv.v2/domain/CsvThesauriPendingRoot.js';
import { CsvThesauriPendingChildProps } from '#api/csv.v2/domain/CsvThesauriPendingChild.js';

type CsvThesauriPendingEntryProps = {
  propertyId: string;
  propertyName: string;
  thesaurusId: string;
  type: 'select' | 'multiselect';
};

class CsvThesauriPendingEntry {
  readonly propertyId: string;

  readonly propertyName: string;

  readonly thesaurusId: string;

  readonly type: 'select' | 'multiselect';

  readonly roots: CsvThesauriPendingRoot[];

  private readonly rootsMap: Map<string, CsvThesauriPendingRoot>;

  constructor(props: CsvThesauriPendingEntryProps) {
    this.propertyId = props.propertyId;
    this.propertyName = props.propertyName;
    this.thesaurusId = props.thesaurusId;
    this.type = props.type;
    this.roots = [];
    this.rootsMap = new Map();
  }

  ensureRoot(props: CsvThesauriPendingChildProps) {
    const existing = this.rootsMap.get(props.normalized);
    if (existing) {
      existing.addLanguage(Object.keys(props.languages)[0], Object.values(props.languages)[0]);
      return existing;
    }
    const root = new CsvThesauriPendingRoot(props);
    this.rootsMap.set(props.normalized, root);
    this.roots.push(root);
    return root;
  }

  getRoot(normalized: string) {
    return this.rootsMap.get(normalized);
  }

  toObject() {
    return {
      propertyId: this.propertyId,
      propertyName: this.propertyName,
      thesaurusId: this.thesaurusId,
      type: this.type,
      roots: this.roots.map(root => root.toObject()),
    };
  }
}

export { CsvThesauriPendingEntry };
