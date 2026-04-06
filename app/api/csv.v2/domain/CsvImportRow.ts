type CsvImportRowProps = {
  importId: string;
  rowIndex: number;
  headers: string[];
  values: string[];
};

class CsvImportRow {
  readonly importId: string;

  readonly rowIndex: number;

  readonly headers: string[];

  readonly values: string[];

  private constructor(props: CsvImportRowProps) {
    this.importId = props.importId;
    this.rowIndex = props.rowIndex;
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
      rowIndex: this.rowIndex,
      headers: this.headers,
      values: this.values,
    };
  }
}

export type { CsvImportRowProps };
export { CsvImportRow };
