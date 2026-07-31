type CsvImportValueRequiredErrorParams = {
  property: string;
  column?: string;
  language?: string;
  rawValue?: string;
};

class CsvImportValueRequiredError extends Error {
  readonly property: string;

  readonly column?: string;

  readonly language?: string;

  readonly rawValue?: string;

  constructor(params: CsvImportValueRequiredErrorParams) {
    const columnLabel = params.column || params.property;
    super(`CSV import missing required value for "${columnLabel}"`);
    this.name = 'CsvImportValueRequiredError';
    this.property = params.property;
    this.column = params.column;
    this.language = params.language;
    this.rawValue = params.rawValue;
  }
}

export { CsvImportValueRequiredError };
export type { CsvImportValueRequiredErrorParams };
