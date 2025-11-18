type CsvHeaderAnalyzerErrorReason =
  | 'MixedLanguageColumns'
  | 'UnsupportedLanguageColumn'
  | 'MissingDefaultLanguage'
  | 'UnknownProperty';

type AnalyzerIssue = {
  reason: CsvHeaderAnalyzerErrorReason;
  message: string;
  property?: string;
  columns?: string[];
};

class CsvHeaderAnalyzerError extends Error {
  readonly issues: AnalyzerIssue[];

  constructor(issues: AnalyzerIssue[]) {
    super('Csv header analysis failed');
    this.issues = issues;
    this.name = 'CsvHeaderAnalyzerError';
  }
}

export { CsvHeaderAnalyzerError };
export type { CsvHeaderAnalyzerErrorReason, AnalyzerIssue };
