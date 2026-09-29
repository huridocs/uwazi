export type UsageKind =
  | 't-call'
  | 'translate-jsx'
  | 'jsx-text'
  | 'attribute'
  | 'component-prop'
  | 'option-label'
  | 'notify'
  | 'composed';

export type FindingKind =
  | 'unwrapped-jsx-text'
  | 'untranslated-attribute'
  | 'untranslated-label'
  | 'untranslated-notify'
  | 'composed-string'
  | 'missing-key'
  | 'unused-key';

export type Severity = 'error' | 'warning';

export type SourceLoc = {
  line: number;
  column: number;
  start: number;
  end: number;
};

export type ExtractedUsage = {
  kind: UsageKind;
  text: string;
  key: string;
  file: string;
  loc: SourceLoc;
  translated: boolean;
  fixable: boolean;
  attrName?: string;
};

export type TranslationEntry = {
  key: string;
  value: string;
  locale: string;
};

export type Finding = {
  kind: FindingKind;
  severity: Severity;
  file: string;
  text: string;
  key: string;
  loc?: SourceLoc;
  fixable: boolean;
  attrName?: string;
  reason?: string;
};

export type CheckTranslationsOptions = {
  dir: string;
  translationsDir: string;
  fix: boolean;
  strict: boolean;
  unused: boolean;
  cwd?: string;
};

export type CheckTranslationsResult = {
  findings: Finding[];
  errors: Finding[];
  warnings: Finding[];
  fixed: Finding[];
  leftover: Finding[];
  addedKeys: string[];
  exitCode: number;
};
