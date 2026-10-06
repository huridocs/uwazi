import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { findUntranslatedCsv, parseUntranslatedCsvArgs } from '../untranslatedCsv.js';

const makeFixture = async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'untranslated-csv-'));
  const translationsDir = path.join(root, 'contents', 'ui-translations');
  const contextFile = path.join(root, 'contents', 'translation-context.csv');
  await mkdir(translationsDir, { recursive: true });
  await writeFile(
    path.join(translationsDir, 'en.csv'),
    'Key,English\nSave,Save\nUpload,Upload\nUwazi,Uwazi\nDone,Done\n'
  );
  await writeFile(
    path.join(translationsDir, 'es.csv'),
    'Key,Spanish\nSave,Guardar\nUpload,Upload\nUwazi,Uwazi\nDone,Done\n'
  );
  await writeFile(
    path.join(translationsDir, 'fr.csv'),
    'Key,French\nSave,Enregistrer\nUpload,Téléverser\nUwazi,Uwazi\nDone,Done\n'
  );
  await writeFile(
    contextFile,
    'Key,Component,View,Context,DoNotTranslate\nUpload,Button label,Library,Uploads a file.,false\n'
  );
  return { root, translationsDir, contextFile };
};

describe('parseUntranslatedCsvArgs', () => {
  it('parses locale, limit and only-new flags', () => {
    expect(
      parseUntranslatedCsvArgs([
        '--only-new',
        '--limit',
        '20',
        '--locales=es,fr',
        '--translations-dir=i18n',
        '--context-file=context.csv',
      ])
    ).toEqual({
      translationsDir: 'i18n',
      contextFile: 'context.csv',
      locales: ['es', 'fr'],
      onlyNew: true,
      limit: 20,
    });
  });
});

describe('findUntranslatedCsv', () => {
  it('reports locale values that still match English, skipping keep-english keys', async () => {
    const { translationsDir, contextFile } = await makeFixture();
    const result = await findUntranslatedCsv({
      translationsDir,
      contextFile,
      locales: [],
      onlyNew: false,
      limit: 0,
    });

    expect(result.rows.map(row => `${row.key}:${row.locale}`).sort()).toEqual([
      'Done:es',
      'Done:fr',
      'Upload:es',
    ]);
    expect(result.rows.some(row => row.key === 'Uwazi')).toBe(false);
    expect(result.rows.some(row => row.key === 'Save')).toBe(false);
  });

  it('with --only-new keeps keys that are still English in every selected locale', async () => {
    const { translationsDir, contextFile } = await makeFixture();
    const result = await findUntranslatedCsv({
      translationsDir,
      contextFile,
      locales: ['es', 'fr'],
      onlyNew: true,
      limit: 0,
    });

    expect(result.rows.map(row => `${row.key}:${row.locale}`).sort()).toEqual([
      'Done:es',
      'Done:fr',
    ]);
  });

  it('limits by unique key', async () => {
    const { translationsDir, contextFile } = await makeFixture();
    const result = await findUntranslatedCsv({
      translationsDir,
      contextFile,
      locales: [],
      onlyNew: false,
      limit: 1,
    });

    expect(new Set(result.rows.map(row => row.key)).size).toBe(1);
  });
});
