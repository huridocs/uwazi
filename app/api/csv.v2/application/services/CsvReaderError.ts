export class CsvReaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsvReaderError';
  }
}
