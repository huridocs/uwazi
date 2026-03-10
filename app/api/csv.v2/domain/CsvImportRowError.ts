type CsvImportRowErrorProps = {
  importId: string;
  rowIndex: number;
  message: string;
  createdAt: number;
};

class CsvImportRowError {
  readonly importId: string;

  readonly rowIndex: number;

  readonly message: string;

  readonly createdAt: number;

  private constructor(props: CsvImportRowErrorProps) {
    this.importId = props.importId;
    this.rowIndex = props.rowIndex;
    this.message = props.message;
    this.createdAt = props.createdAt;
  }

  static create(props: Omit<CsvImportRowErrorProps, 'createdAt'> & { createdAt?: number }) {
    return new CsvImportRowError({
      ...props,
      createdAt: props.createdAt ?? Date.now(),
    });
  }

  static fromObject(props: CsvImportRowErrorProps) {
    return new CsvImportRowError(props);
  }

  toObject() {
    return {
      importId: this.importId,
      rowIndex: this.rowIndex,
      message: this.message,
      createdAt: this.createdAt,
    };
  }
}

export type { CsvImportRowErrorProps };
export { CsvImportRowError };
