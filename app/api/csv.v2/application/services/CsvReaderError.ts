type CsvParseFailureReason = 'UnclosedQuote' | 'ColumnMismatch' | 'CsvUnreadable';

type CsvReaderErrorDetails = {
  reason?: CsvParseFailureReason;
  line?: number;
};

const MISSING_HEADER_MESSAGE = 'The CSV could not be read because it has no header row.';

class CsvReaderError extends Error {
  readonly reason: CsvParseFailureReason;

  readonly line?: number;

  constructor(message: string, details?: CsvReaderErrorDetails) {
    super(message);
    this.name = 'CsvReaderError';
    this.reason = details?.reason ?? 'CsvUnreadable';
    this.line = details?.line;
  }
}

const missingCsvHeaderError = () =>
  new CsvReaderError(MISSING_HEADER_MESSAGE, { reason: 'CsvUnreadable' });

export { CsvReaderError, missingCsvHeaderError };
export type { CsvParseFailureReason };
