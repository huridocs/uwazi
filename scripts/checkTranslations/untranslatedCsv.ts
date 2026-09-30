import path from 'node:path';

import { shouldKeepEnglish } from './keepEnglish.js';
import { loadTranslationContext, type TranslationContextRow } from './translationContext.js';
import { listLocales, loadLocaleCsv } from './translations.js';
import type { TranslationEntry } from './types.js';
import {
  parseUntranslatedCsvArgs,
  untranslatedCsvHelpText,
  type UntranslatedCsvOptions,
} from './untranslatedCsvArgs.js';

type UntranslatedCsvRow = {
  key: string;
  locale: string;
  english: string;
  value: string;
  component: string;
  view: string;
  context: string;
};

type UntranslatedCsvResult = {
  rows: UntranslatedCsvRow[];
  exitCode: number;
};

const englishByKey = (entries: TranslationEntry[]): Map<string, string> =>
  new Map(entries.map(entry => [entry.key, entry.value]));

const localeValue = (entries: TranslationEntry[], key: string): string | undefined =>
  entries.find(entry => entry.key === key)?.value;

const isStillEnglish = (value: string | undefined, key: string, english: string): boolean =>
  value === key || value === english;

const loadContextRows = async (file: string): Promise<TranslationContextRow[]> => {
  try {
    return await loadTranslationContext(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const selectedLocales = (available: string[], requested: string[]): string[] => {
  const withoutEnglish = available.filter(locale => locale !== 'en');
  if (!requested.length) {
    return withoutEnglish;
  }
  return requested.filter(locale => withoutEnglish.includes(locale));
};

type RowBuildInput = {
  key: string;
  english: string;
  locale: string;
  value: string;
  context?: TranslationContextRow;
};

const toRow = ({ key, english, locale, value, context }: RowBuildInput): UntranslatedCsvRow => ({
  key,
  locale,
  english,
  value,
  component: context?.component ?? '',
  view: context?.view ?? '',
  context: context?.context ?? '',
});

type KeyScanInput = {
  key: string;
  english: string;
  locales: string[];
  byLocale: Map<string, TranslationEntry[]>;
  context?: TranslationContextRow;
};

const untranslatedLocalesForKey = ({
  key,
  english,
  locales,
  byLocale,
  context,
}: KeyScanInput): UntranslatedCsvRow[] => {
  if (
    shouldKeepEnglish({
      key,
      component: context?.component,
      doNotTranslate: context?.doNotTranslate,
    })
  ) {
    return [];
  }
  return locales.flatMap(locale => {
    const value = localeValue(byLocale.get(locale) ?? [], key);
    if (!isStillEnglish(value, key, english) || value === undefined) {
      return [];
    }
    return [toRow({ key, english, locale, value, context })];
  });
};

const filterOnlyNew = (rows: UntranslatedCsvRow[], localeCount: number, onlyNew: boolean) => {
  if (!onlyNew) {
    return rows;
  }
  const byKey = new Map<string, UntranslatedCsvRow[]>();
  rows.forEach(row => {
    byKey.set(row.key, [...(byKey.get(row.key) ?? []), row]);
  });
  return rows.filter(row => (byKey.get(row.key) ?? []).length === localeCount);
};

const limitUniqueKeys = (rows: UntranslatedCsvRow[], limit: number): UntranslatedCsvRow[] => {
  if (!limit) {
    return rows;
  }
  const keys = [...new Set(rows.map(row => row.key))].slice(0, limit);
  const allowed = new Set(keys);
  return rows.filter(row => allowed.has(row.key));
};

const compareRows = (left: UntranslatedCsvRow, right: UntranslatedCsvRow): number =>
  left.key.localeCompare(right.key) || left.locale.localeCompare(right.locale);

const loadLocaleMap = async (
  translationsDir: string,
  locales: string[]
): Promise<Map<string, TranslationEntry[]>> => {
  const byLocale = new Map<string, TranslationEntry[]>();
  await Promise.all(
    locales.map(async locale => {
      byLocale.set(locale, await loadLocaleCsv(translationsDir, locale));
    })
  );
  return byLocale;
};

type CollectRowsInput = {
  english: Map<string, string>;
  locales: string[];
  byLocale: Map<string, TranslationEntry[]>;
  contextByKey: Map<string, TranslationContextRow>;
};

const collectUntranslatedRows = ({
  english,
  locales,
  byLocale,
  contextByKey,
}: CollectRowsInput): UntranslatedCsvRow[] =>
  [...english.keys()].flatMap(key =>
    untranslatedLocalesForKey({
      key,
      english: english.get(key) ?? key,
      locales,
      byLocale,
      context: contextByKey.get(key),
    })
  );

const findUntranslatedCsv = async (
  options: UntranslatedCsvOptions
): Promise<UntranslatedCsvResult> => {
  const cwd = options.cwd ?? process.cwd();
  const translationsDir = path.resolve(cwd, options.translationsDir);
  const locales = selectedLocales(await listLocales(translationsDir), options.locales);
  const english = englishByKey(await loadLocaleCsv(translationsDir, 'en'));
  const contextByKey = new Map(
    (await loadContextRows(path.resolve(cwd, options.contextFile))).map(row => [row.key, row])
  );
  const rows = collectUntranslatedRows({
    english,
    locales,
    byLocale: await loadLocaleMap(translationsDir, locales),
    contextByKey,
  });
  const filtered = limitUniqueKeys(
    filterOnlyNew(rows, locales.length, options.onlyNew),
    options.limit
  );
  const ordered = [...filtered].sort(compareRows);
  return { rows: ordered, exitCode: ordered.length ? 1 : 0 };
};

const markdownCell = (value: string): string => value.replaceAll('|', '\\|').replaceAll('\n', ' ');

const formatUntranslatedCsvReport = (result: UntranslatedCsvResult): string => {
  if (!result.rows.length) {
    return '\x1b[32mAll locale values that need translation are filled.\x1b[0m\n';
  }
  const lines = [
    `=== untranslated-csv (${result.rows.length}) ===`,
    '| Key | Locale | Component | View | Context |',
    '| --- | --- | --- | --- | --- |',
    ...result.rows.map(
      row =>
        `| ${markdownCell(row.key)} | ${row.locale} | ${markdownCell(row.component)} | ${markdownCell(row.view)} | ${markdownCell(row.context)} |`
    ),
    '',
  ];
  return `${lines.join('\n')}\n`;
};

const printUntranslatedCsvResult = (
  result: UntranslatedCsvResult,
  write: (text: string) => void = text => {
    process.stdout.write(text);
  }
): void => {
  write(formatUntranslatedCsvReport(result));
};

export {
  findUntranslatedCsv,
  formatUntranslatedCsvReport,
  parseUntranslatedCsvArgs,
  printUntranslatedCsvResult,
  untranslatedCsvHelpText,
};
export type { UntranslatedCsvOptions, UntranslatedCsvResult, UntranslatedCsvRow };
