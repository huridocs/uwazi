type CsvImportRowProps = {
  importId: string;
  index: number;
  headers: string[];
  values: string[];
};

class CsvImportRow {
  readonly importId: string;

  readonly index: number;

  readonly headers: string[];

  readonly values: string[];

  private constructor(props: CsvImportRowProps) {
    this.importId = props.importId;
    this.index = props.index;
    this.headers = props.headers;
    this.values = props.values;
  }

  static create(props: CsvImportRowProps) {
    return new CsvImportRow(props);
  }

  static fromObject(props: CsvImportRowProps) {
    return new CsvImportRow(props);
  }

  toObject() {
    return {
      importId: this.importId,
      index: this.index,
      headers: this.headers,
      values: this.values,
    };
  }
}

export type { CsvImportRowProps };
export { CsvImportRow };
