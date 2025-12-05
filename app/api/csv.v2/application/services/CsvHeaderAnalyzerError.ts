import { inspect } from 'util';

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
    this.stack = `${this.name}: ${this.message}\nIssues:\n- ${issues.map(i => inspect(i)).join('\n- ')}\n\n${this.stack}`;
  }
}

export { CsvHeaderAnalyzerError };
export type { CsvHeaderAnalyzerErrorReason, AnalyzerIssue };
