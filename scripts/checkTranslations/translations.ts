import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import csvtojson from 'csvtojson';

import type { TranslationEntry } from './types.js';

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

const listLocales = async (translationsDir: string): Promise<string[]> => {
  const files = await readdir(translationsDir);
  return files.filter(file => file.endsWith('.csv')).map(file => file.replace(/\.csv$/, ''));
};

const loadLocaleCsv = async (
  translationsDir: string,
  locale: string
): Promise<TranslationEntry[]> => {
  const filePath = path.join(translationsDir, `${locale}.csv`);
  const content = await readFile(filePath, 'utf8');
  const rows: { key: string; value: string }[] = await csvtojson({
    delimiter: [',', ';'],
    quote: '"',
    headers: ['key', 'value'],
  }).fromString(content);
  return rows
    .filter(row => row.key && row.key !== 'Key')
    .map(row => ({ key: row.key, value: row.value, locale }));
};

const loadEnglishTranslations = async (translationsDir: string): Promise<TranslationEntry[]> =>
  loadLocaleCsv(translationsDir, 'en');

const csvCell = (value: string): string => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const writeLocaleCsv = async (
  translationsDir: string,
  locale: string,
  entries: TranslationEntry[]
): Promise<void> => {
  const header = ['Key', languageNames.of(locale) ?? locale];
  const ordered = [...entries].sort((left, right) =>
    left.key.toLowerCase().localeCompare(right.key.toLowerCase())
  );
  const lines = [
    header.join(','),
    ...ordered.map(entry => `${csvCell(entry.key)},${csvCell(entry.value || entry.key)}`),
  ];
  await writeFile(path.join(translationsDir, `${locale}.csv`), `${lines.join('\n')}\n`);
};

type LocaleUpdateInput = {
  existing: TranslationEntry[];
  locale: string;
  toAdd: string[];
  toRemove: Set<string>;
};

const nextLocaleEntries = ({
  existing,
  locale,
  toAdd,
  toRemove,
}: LocaleUpdateInput): { entries: TranslationEntry[]; added: string[]; removed: string[] } => {
  const existingKeys = new Set(existing.map(entry => entry.key));
  const removed = existing.filter(entry => toRemove.has(entry.key)).map(entry => entry.key);
  const added = toAdd.filter(key => !existingKeys.has(key) && !toRemove.has(key));
  return {
    entries: [
      ...existing.filter(entry => !toRemove.has(entry.key)),
      ...added.map(key => ({ key, value: key, locale })),
    ],
    added,
    removed,
  };
};

const applyCsvKeyUpdates = async (
  translationsDir: string,
  addKeys: string[],
  removeKeys: string[] = []
): Promise<{ addedKeys: string[]; removedKeys: string[] }> => {
  const toAdd = [...new Set(addKeys.filter(Boolean))];
  const toRemove = new Set(removeKeys.filter(Boolean));
  if (!toAdd.length && !toRemove.size) {
    return { addedKeys: [], removedKeys: [] };
  }

  const locales = await listLocales(translationsDir);
  const summary = { addedKeys: [] as string[], removedKeys: [] as string[] };

  await Promise.all(
    locales.map(async locale => {
      const existing = await loadLocaleCsv(translationsDir, locale);
      const next = nextLocaleEntries({ existing, locale, toAdd, toRemove });
      if (next.entries.length !== existing.length) {
        await writeLocaleCsv(translationsDir, locale, next.entries);
      }
      if (locale === 'en') {
        summary.addedKeys = next.added;
        summary.removedKeys = next.removed;
      }
    })
  );

  return summary;
};

const addMissingKeysToCsvs = async (translationsDir: string, keys: string[]): Promise<string[]> => {
  const { addedKeys } = await applyCsvKeyUpdates(translationsDir, keys, []);
  return addedKeys;
};

export {
  addMissingKeysToCsvs,
  applyCsvKeyUpdates,
  listLocales,
  loadEnglishTranslations,
  loadLocaleCsv,
  writeLocaleCsv,
};
