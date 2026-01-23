import {
  CsvThesauriPendingChild,
  CsvThesauriPendingChildProps,
} from '#api/csv.v2/domain/CsvThesauriPendingChild.js';

class CsvThesauriPendingRoot {
  readonly label: string;

  readonly normalized: string;

  readonly languages: Record<string, string>;

  readonly children: CsvThesauriPendingChild[];

  private readonly childrenMap: Map<string, CsvThesauriPendingChild>;

  constructor(props: CsvThesauriPendingChildProps) {
    this.label = props.label;
    this.normalized = props.normalized;
    this.languages = { ...props.languages };
    this.children = [];
    this.childrenMap = new Map();
  }

  addLanguage(lang: string, value: string) {
    if (!value) return;
    this.languages[lang] = value;
  }

  ensureChild(props: CsvThesauriPendingChildProps) {
    const existing = this.childrenMap.get(props.normalized);
    if (existing) {
      existing.addLanguage(Object.keys(props.languages)[0], Object.values(props.languages)[0]);
      return existing;
    }
    const child = new CsvThesauriPendingChild(props);
    this.childrenMap.set(props.normalized, child);
    this.children.push(child);
    return child;
  }

  getChild(normalized: string) {
    return this.childrenMap.get(normalized);
  }

  toObject() {
    return {
      label: this.label,
      normalized: this.normalized,
      languages: { ...this.languages },
      children: this.children.map(child => child.toObject()),
    };
  }
}

export { CsvThesauriPendingRoot };
