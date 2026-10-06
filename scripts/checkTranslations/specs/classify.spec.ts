import { classifyUsages } from '../classify.js';
import { COMPOSED_PLACEHOLDER } from '../heuristics.js';
import type { ExtractedUsage, TranslationEntry } from '../types.js';

const loc = { line: 1, column: 0, start: 0, end: 10 };

const usage = (overrides: Partial<ExtractedUsage>): ExtractedUsage => ({
  kind: 'jsx-text',
  text: 'Close modal',
  key: 'Close modal',
  file: 'Modal.tsx',
  loc,
  translated: false,
  fixable: true,
  ...overrides,
});

const translations: TranslationEntry[] = [
  { key: 'Save', value: 'Save', locale: 'en' },
  { key: 'Close modal', value: 'Close modal', locale: 'en' },
  { key: 'Unused leftover', value: 'Unused leftover', locale: 'en' },
];

describe('classifyUsages', () => {
  it('reports unwrapped JSX text as an error', () => {
    const findings = classifyUsages(
      [usage({ kind: 'jsx-text', text: 'Hello', key: 'Hello', translated: false, fixable: true })],
      translations
    );

    expect(findings).toContainEqual(
      expect.objectContaining({
        kind: 'unwrapped-jsx-text',
        severity: 'error',
        key: 'Hello',
        fixable: true,
      })
    );
  });

  it('reports untranslated attributes / labels / notify as warnings', () => {
    const findings = classifyUsages(
      [
        usage({ kind: 'attribute', text: 'Search', key: 'Search' }),
        usage({ kind: 'option-label', text: 'Text', key: 'Text', fixable: false }),
        usage({ kind: 'notify', text: 'Document updated', key: 'Document updated' }),
        usage({ kind: 'component-prop', text: 'Operator', key: 'Operator', fixable: false }),
      ],
      translations
    );

    const untranslated = findings.filter(finding => finding.kind !== 'unused-key');
    expect(untranslated.map(finding => finding.kind).sort()).toEqual([
      'untranslated-attribute',
      'untranslated-label',
      'untranslated-label',
      'untranslated-notify',
    ]);
    expect(untranslated.every(finding => finding.severity === 'warning')).toBe(true);
  });

  it('reports composed strings as warnings that cannot be auto-fixed', () => {
    const findings = classifyUsages(
      [
        usage({
          kind: 'composed',
          text: `Page ${COMPOSED_PLACEHOLDER}`,
          key: `Page ${COMPOSED_PLACEHOLDER}`,
          fixable: false,
        }),
      ],
      translations
    );

    expect(findings).toContainEqual(
      expect.objectContaining({ kind: 'composed-string', severity: 'warning', fixable: false })
    );
  });

  it('reports t()/Translate keys missing from the CSV as errors', () => {
    const findings = classifyUsages(
      [
        usage({
          kind: 't-call',
          text: 'Brand new key',
          key: 'Brand new key',
          translated: true,
          fixable: false,
        }),
      ],
      translations
    );

    expect(findings).toContainEqual(
      expect.objectContaining({ kind: 'missing-key', severity: 'error', key: 'Brand new key' })
    );
  });

  it('does not mark a CSV key unused when it is looked up or appears as UI copy', () => {
    const findings = classifyUsages(
      [usage({ kind: 't-call', text: 'Save', key: 'Save', translated: true, fixable: false })],
      translations
    );

    expect(findings.filter(finding => finding.kind === 'unused-key')).toEqual([]);
  });

  it('reports unused CSV keys only when asked', () => {
    const findings = classifyUsages(
      [usage({ kind: 't-call', text: 'Save', key: 'Save', translated: true, fixable: false })],
      translations,
      { includeUnused: true }
    );

    expect(
      findings
        .filter(finding => finding.kind === 'unused-key')
        .map(finding => finding.key)
        .sort()
    ).toEqual(['Close modal', 'Unused leftover']);
  });

  it('does not report translated usages as untranslated', () => {
    const findings = classifyUsages(
      [
        usage({
          kind: 'translate-jsx',
          text: 'Save',
          key: 'Save',
          translated: true,
          fixable: false,
        }),
      ],
      translations
    );

    expect(findings.filter(finding => finding.kind !== 'unused-key')).toEqual([]);
  });
});
