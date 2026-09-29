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

const addMissingKeysToCsvs = async (translationsDir: string, keys: string[]): Promise<string[]> => {
  const uniqueKeys = [...new Set(keys.filter(Boolean))];
  if (!uniqueKeys.length) {
    return [];
  }

  const locales = await listLocales(translationsDir);
  const added: string[] = [];

  await Promise.all(
    locales.map(async locale => {
      const existing = await loadLocaleCsv(translationsDir, locale);
      const existingKeys = new Set(existing.map(entry => entry.key));
      const nextEntries = [...existing];
      uniqueKeys.forEach(key => {
        if (!existingKeys.has(key)) {
          nextEntries.push({ key, value: key, locale });
          if (locale === 'en') {
            added.push(key);
          }
        }
      });
      if (nextEntries.length !== existing.length) {
        await writeLocaleCsv(translationsDir, locale, nextEntries);
      }
    })
  );

  return added;
};

export {
  addMissingKeysToCsvs,
  listLocales,
  loadEnglishTranslations,
  loadLocaleCsv,
  writeLocaleCsv,
};
