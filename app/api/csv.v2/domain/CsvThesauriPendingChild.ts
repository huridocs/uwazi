type CsvThesauriPendingChildProps = {
  label: string;
  normalized: string;
  languages: Record<string, string>;
};

class CsvThesauriPendingChild {
  readonly label: string;

  readonly normalized: string;

  readonly languages: Record<string, string>;

  constructor(props: CsvThesauriPendingChildProps) {
    this.label = props.label;
    this.normalized = props.normalized;
    this.languages = { ...props.languages };
  }

  addLanguage(lang: string, value: string) {
    if (!value) return;
    this.languages[lang] = value;
  }

  toObject(): CsvThesauriPendingChildProps {
    return {
      label: this.label,
      normalized: this.normalized,
      languages: { ...this.languages },
    };
  }
}

export type { CsvThesauriPendingChildProps };
export { CsvThesauriPendingChild };
