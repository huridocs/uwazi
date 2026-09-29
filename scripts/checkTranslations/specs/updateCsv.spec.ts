import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { COMPOSED_PLACEHOLDER } from '../heuristics.js';
import { parseUpdateCsvArgs, runUpdateTranslationsCsv } from '../updateCsv.js';
import type { UpdateCsvResult } from '../updateCsv.js';

const makeFixture = async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'update-translations-csv-'));
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
    <Translate>Save</Translate>
    {t('System', 'Library', null, false)}
  </section>
);
notify('Document updated', 'success');
const options = [{ value: 'text', label: 'Rich text' }];
const page = <button aria-label={\`Page \${n}\`} />;
`
  );
  await writeFile(
    path.join(csvDir, 'en.csv'),
    'Key,English\nSave,Save\nObsolete leftover,Obsolete leftover\n'
  );
  await writeFile(
    path.join(csvDir, 'es.csv'),
    'Key,Spanish\nSave,Guardar\nObsolete leftover,Sobra\n'
  );
  return { root, srcDir, csvDir };
};

const expectAddedFixableKeys = (result: UpdateCsvResult, enCsv: string) => {
  expect(result.addedKeys.sort()).toEqual(['Close modal', 'Document updated', 'Done', 'Library']);
  expect(enCsv).toContain('Close modal');
  expect(enCsv).toContain('Document updated');
  expect(enCsv).toContain('Library');
  expect(enCsv).toContain('Done');
  expect(enCsv).toContain('Obsolete leftover');
};

const expectLeftOutNonCsvCopy = (enCsv: string) => {
  expect(enCsv).not.toContain('Rich text');
  expect(enCsv).not.toContain(`Page ${COMPOSED_PLACEHOLDER}`);
  expect(enCsv).not.toContain('entity.title');
};

describe('parseUpdateCsvArgs', () => {
  it('parses --dry, --prune and path flags', () => {
    expect(
      parseUpdateCsvArgs(['--dry', '--prune', '--dir', './src', '--translations-dir=i18n'])
    ).toEqual({
      dir: './src',
      translationsDir: 'i18n',
      dry: true,
      prune: true,
    });
  });
});

describe('runUpdateTranslationsCsv', () => {
  it('adds missing keys from t()/Translate and --fix-able copy, not labels or interpolations', async () => {
    const { root, srcDir, csvDir } = await makeFixture();
    const result = await runUpdateTranslationsCsv({
      dir: srcDir,
      translationsDir: csvDir,
      dry: false,
      prune: false,
      cwd: root,
    });
    const enCsv = await readFile(path.join(csvDir, 'en.csv'), 'utf8');
    expectAddedFixableKeys(result, enCsv);
    expectLeftOutNonCsvCopy(enCsv);
  });

  it('does not write on --dry', async () => {
    const { root, srcDir, csvDir } = await makeFixture();
    const before = await readFile(path.join(csvDir, 'en.csv'), 'utf8');
    const result = await runUpdateTranslationsCsv({
      dir: srcDir,
      translationsDir: csvDir,
      dry: true,
      prune: true,
      cwd: root,
    });

    expect(result.addedKeys.length).toBeGreaterThan(0);
    expect(result.removedKeys).toEqual(['Obsolete leftover']);
    expect(await readFile(path.join(csvDir, 'en.csv'), 'utf8')).toBe(before);
  });

  it('removes unused keys only with --prune', async () => {
    const { root, srcDir, csvDir } = await makeFixture();
    const result = await runUpdateTranslationsCsv({
      dir: srcDir,
      translationsDir: csvDir,
      dry: false,
      prune: true,
      cwd: root,
    });

    const enCsv = await readFile(path.join(csvDir, 'en.csv'), 'utf8');
    const esCsv = await readFile(path.join(csvDir, 'es.csv'), 'utf8');
    expect(result.removedKeys).toEqual(['Obsolete leftover']);
    expect(enCsv).not.toContain('Obsolete leftover');
    expect(esCsv).not.toContain('Obsolete leftover');
    expect(enCsv).toContain('Save');
  });
});
