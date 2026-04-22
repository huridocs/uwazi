class CsvImportRowEmptyError extends Error {
  constructor() {
    super('CSV import row is empty.');
    this.name = 'CsvImportRowEmptyError';
  }
}

export { CsvImportRowEmptyError };
