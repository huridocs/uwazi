type CsvHeaderAnalyzerErrorReason =
  | 'MixedLanguageColumns'
  | 'UnsupportedLanguageColumn'
  | 'MissingDefaultLanguage'
  | 'UnknownProperty';

type AnalyzerErrorContext = {
  property?: string;
  columns?: string[];
};

class CsvHeaderAnalyzerError extends Error {
  readonly reason: CsvHeaderAnalyzerErrorReason;

  readonly context?: AnalyzerErrorContext;

  constructor(
    reason: CsvHeaderAnalyzerErrorReason,
    message: string,
    context?: AnalyzerErrorContext
  ) {
    super(message);
    this.reason = reason;
    this.context = context;
    this.name = 'CsvHeaderAnalyzerError';
  }
}

export { CsvHeaderAnalyzerError };
export type { CsvHeaderAnalyzerErrorReason, AnalyzerErrorContext };
