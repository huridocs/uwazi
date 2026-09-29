import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { formatReport, parseArgs, runCheckTranslations } from '../run.js';
import type { CheckTranslationsResult, Finding } from '../types.js';

const makeFixture = async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'check-translations-'));
  const srcDir = path.join(root, 'app', 'react');
  const csvDir = path.join(root, 'contents', 'ui-translations');
  await mkdir(srcDir, { recursive: true });
  await mkdir(csvDir, { recursive: true });
  await writeFile(
    path.join(srcDir, 'Widget.tsx'),
    `import React from 'react';

export const Widget = ({ entity }: { entity: { title: string } }) => (
  <section>
    <h1 title={entity.title}>{entity.title}</h1>
    <button aria-label="Close modal">Done</button>
    <select>
      {[{ value: 'text', label: 'Text' }].map(option => (
        <option key={option.value}>{option.label}</option>
      ))}
    </select>
  </section>
);
`
  );
  await writeFile(path.join(csvDir, 'en.csv'), 'Key,English\nSave,Save\n');
  await writeFile(path.join(csvDir, 'es.csv'), 'Key,Spanish\nSave,Guardar\n');
  return { root, srcDir, csvDir };
};

const expectFixedSource = (source: string) => {
  expect(source).toContain("aria-label={t('System', 'Close modal', null, false)}");
  expect(source).toContain('<Translate>Done</Translate>');
  expect(source).toContain("label: 'Text'");
  expect(source).toContain("import { t, Translate } from '#app/I18N/index.js';");
};

const expectFixedCsvAndLeftovers = async (csvDir: string, after: CheckTranslationsResult) => {
  const enCsv = await readFile(path.join(csvDir, 'en.csv'), 'utf8');
  expect(enCsv).toContain('Close modal');
  expect(enCsv).toContain('Done');
  expect(after.fixed.map(finding => finding.key).sort()).toEqual(['Close modal', 'Done']);
  expect(after.leftover.some(finding => finding.kind === 'untranslated-label')).toBe(true);
  expect(after.errors).toEqual([]);
};

describe('parseArgs', () => {
  it('parses --fix, --strict and path flags', () => {
    expect(
      parseArgs(['--fix', '--strict', '--unused', '--dir', './src', '--translations-dir=i18n'])
    ).toEqual({
      dir: './src',
      translationsDir: 'i18n',
      fix: true,
      strict: true,
      unused: true,
    });
  });

  it('rejects unknown flags', () => {
    expect(() => parseArgs(['--from-db'])).toThrow('Unknown argument: --from-db');
  });
});

describe('runCheckTranslations', () => {
  it('does not flag entity.title and reports untranslated UI copy', async () => {
    const { root, srcDir, csvDir } = await makeFixture();
    const before = await runCheckTranslations({
      dir: srcDir,
      translationsDir: csvDir,
      fix: false,
      strict: false,
      unused: false,
      cwd: root,
    });

    expect(before.errors.map(finding => finding.text)).toEqual(['Done']);
    expect(before.warnings.map(finding => finding.kind).sort()).toEqual([
      'untranslated-attribute',
      'untranslated-label',
    ]);
    expect(before.findings.some(finding => finding.text === 'entity.title')).toBe(false);
  });

  it('wraps fixable copy with --fix and leaves option labels', async () => {
    const { root, srcDir, csvDir } = await makeFixture();
    const after = await runCheckTranslations({
      dir: srcDir,
      translationsDir: csvDir,
      fix: true,
      strict: false,
      unused: false,
      cwd: root,
    });
    const source = await readFile(path.join(srcDir, 'Widget.tsx'), 'utf8');
    expectFixedSource(source);
    await expectFixedCsvAndLeftovers(csvDir, after);
  });
});

const findingRow = (input: {
  kind: Finding['kind'];
  file: string;
  text: string;
  line: number;
  fixable: boolean;
}): Finding => ({
  kind: input.kind,
  severity: 'warning',
  file: input.file,
  text: input.text,
  key: input.text,
  loc: { line: input.line, column: 0, start: 0, end: 1 },
  fixable: input.fixable,
});

describe('formatReport', () => {
  it('prints a table of untranslated text, file and line', () => {
    const report = formatReport(
      [
        findingRow({
          kind: 'untranslated-attribute',
          file: 'app/react/V2/Components/UI/Modal.tsx',
          text: 'Close modal',
          line: 108,
          fixable: true,
        }),
        findingRow({
          kind: 'untranslated-label',
          file: 'app/react/Metadata/options.ts',
          text: 'Rich text',
          line: 12,
          fixable: false,
        }),
      ],
      { fixed: [], addedKeys: [] }
    );

    expect(report).toContain('| Texto no traducido | Archivo | Línea |');
    expect(report).toContain('| Close modal | app/react/V2/Components/UI/Modal.tsx | 108 |');
    expect(report).toContain('| Rich text | app/react/Metadata/options.ts | 12 |');
  });
});
