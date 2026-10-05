import type { ExtractedUsage, Finding, FindingKind, Severity, TranslationEntry } from './types.js';
import { normalizeKey } from './heuristics.js';

const USAGE_TO_FINDING: Record<
  ExtractedUsage['kind'],
  { kind: FindingKind; severity: Severity } | undefined
> = {
  't-call': undefined,
  'translate-jsx': undefined,
  'jsx-text': { kind: 'unwrapped-jsx-text', severity: 'error' },
  attribute: { kind: 'untranslated-attribute', severity: 'warning' },
  'component-prop': { kind: 'untranslated-label', severity: 'warning' },
  'option-label': { kind: 'untranslated-label', severity: 'warning' },
  notify: { kind: 'untranslated-notify', severity: 'warning' },
  composed: { kind: 'composed-string', severity: 'warning' },
};

const translationKeys = (translations: TranslationEntry[]): Set<string> =>
  new Set(translations.map(entry => normalizeKey(entry.key)));

const usedKeysFrom = (usages: ExtractedUsage[]): Set<string> => {
  const used = new Set<string>();
  usages.forEach(item => {
    used.add(normalizeKey(item.key));
    used.add(normalizeKey(item.text));
  });
  return used;
};

const unusedFindings = (usages: ExtractedUsage[], translations: TranslationEntry[]): Finding[] => {
  const usedKeys = usedKeysFrom(usages);
  const seenUnused = new Set<string>();
  return translations.flatMap(entry => {
    const key = normalizeKey(entry.key);
    if (usedKeys.has(key) || seenUnused.has(key)) {
      return [];
    }
    seenUnused.add(key);
    return [
      {
        kind: 'unused-key' as const,
        severity: 'warning' as const,
        file: '',
        text: entry.value,
        key: entry.key,
        fixable: false,
        reason: 'Present in CSV but never looked up and never found as UI copy',
      },
    ];
  });
};

const classifyTranslated = (item: ExtractedUsage, csvKeys: Set<string>): Finding[] => {
  if (csvKeys.has(normalizeKey(item.key))) {
    return [];
  }
  return [
    {
      kind: 'missing-key',
      severity: 'error',
      file: item.file,
      text: item.text,
      key: item.key,
      loc: item.loc,
      fixable: true,
      reason: 'Looked up via t()/Translate but missing from locale CSV',
    },
  ];
};

const classifyUntranslated = (item: ExtractedUsage, seen: Set<string>): Finding[] => {
  const mapping = USAGE_TO_FINDING[item.kind];
  if (!mapping) {
    return [];
  }
  const dedupeKey = `${item.kind}:${item.file}:${item.loc.start}:${item.key}`;
  if (seen.has(dedupeKey)) {
    return [];
  }
  seen.add(dedupeKey);
  return [
    {
      kind: mapping.kind,
      severity: mapping.severity,
      file: item.file,
      text: item.text,
      key: item.key,
      loc: item.loc,
      fixable: item.fixable,
      attrName: item.attrName,
    },
  ];
};

const classifyUsages = (
  usages: ExtractedUsage[],
  translations: TranslationEntry[],
  options: { includeUnused?: boolean } = {}
): Finding[] => {
  const csvKeys = translationKeys(translations);
  const seenUntranslated = new Set<string>();
  const findings = usages.flatMap(item =>
    item.translated
      ? classifyTranslated(item, csvKeys)
      : classifyUntranslated(item, seenUntranslated)
  );
  if (options.includeUnused) {
    return [...findings, ...unusedFindings(usages, translations)];
  }
  return findings;
};

export { classifyUsages };
