import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { classifyUsages } from './classify.js';
import { extractUsages } from './extractUsages.js';
import { applyCsvKeyUpdates, loadEnglishTranslations } from './translations.js';
import type { Finding } from './types.js';
import { listSourceFiles } from './walkFiles.js';

type UpdateCsvOptions = {
  dir: string;
  translationsDir: string;
  dry: boolean;
  prune: boolean;
  cwd?: string;
};

type UpdateCsvResult = {
  addedKeys: string[];
  removedKeys: string[];
  dry: boolean;
};

const ADDABLE_KINDS: Finding['kind'][] = [
  'missing-key',
  'unwrapped-jsx-text',
  'untranslated-attribute',
  'untranslated-notify',
];

const BOOLEAN_FLAGS: Record<string, 'dry' | 'prune'> = {
  '--dry': 'dry',
  '--prune': 'prune',
};

const PATH_OPTION_BY_FLAG: Record<string, 'dir' | 'translationsDir'> = {
  '--dir': 'dir',
  '--translations-dir': 'translationsDir',
};

const applyBooleanFlag = (options: UpdateCsvOptions, arg: string): boolean => {
  const flag = BOOLEAN_FLAGS[arg];
  if (!flag) {
    return false;
  }
  options[flag] = true;
  return true;
};

type PathFlagInput = {
  options: UpdateCsvOptions;
  arg: string;
  argv: string[];
  index: number;
  consumed: Set<number>;
};

const applyPathFlag = ({ options, arg, argv, index, consumed }: PathFlagInput): boolean => {
  const [flag, inline] = arg.split('=');
  const key = PATH_OPTION_BY_FLAG[flag];
  if (!key) {
    return false;
  }
  options[key] = inline ?? argv[index + 1];
  if (inline === undefined) {
    consumed.add(index + 1);
  }
  return true;
};

const parseUpdateCsvArgs = (argv: string[]): UpdateCsvOptions => {
  const options: UpdateCsvOptions = {
    dir: './app',
    translationsDir: 'contents/ui-translations',
    dry: false,
    prune: false,
  };
  const consumed = new Set<number>();
  argv.forEach((arg, index, all) => {
    const handled =
      consumed.has(index) ||
      applyBooleanFlag(options, arg) ||
      arg === '--help' ||
      arg === '-h' ||
      applyPathFlag({ options, arg, argv: all, index, consumed });
    if (handled) {
      return;
    }
    throw new Error(`Unknown argument: ${arg}`);
  });
  return options;
};

const updateCsvHelpText = `Usage: yarn update-translations-csv [--dry] [--prune] [--dir <path>] [--translations-dir <path>]

Adds System UI keys found by check-translations to locale CSVs.
Uses the same extractor as yarn check-translations.

  --dry                 Report what would change without writing CSV files.
  --prune               Also delete CSV keys that are never looked up and never
                        found as UI copy. Opt-in: the new unused pass is stricter
                        than the old string-scan and can drop dynamically used keys.
  --dir                 Source root to scan (default: ./app)
  --translations-dir    Locale CSV directory (default: contents/ui-translations)

Adds: t()/Translate keys missing from the CSV, plus unwrapped JSX text,
native attributes and notify() messages. Does not add option-label maps or
composed interpolations.
`;

const collectUsages = async (files: string[]) =>
  (
    await Promise.all(
      files.map(async file => {
        const source = await readFile(file, 'utf8');
        return extractUsages(source, file);
      })
    )
  ).flat();

const keysToAdd = (findings: Finding[]): string[] => [
  ...new Set(
    findings.filter(finding => ADDABLE_KINDS.includes(finding.kind)).map(finding => finding.key)
  ),
];

const keysToPrune = (findings: Finding[], prune: boolean): string[] => {
  if (!prune) {
    return [];
  }
  return [
    ...new Set(
      findings.filter(finding => finding.kind === 'unused-key').map(finding => finding.key)
    ),
  ];
};

const plannedUpdates = (
  findings: Finding[],
  prune: boolean
): { addedKeys: string[]; removedKeys: string[] } => ({
  addedKeys: keysToAdd(findings),
  removedKeys: keysToPrune(findings, prune),
});

const runUpdateTranslationsCsv = async (options: UpdateCsvOptions): Promise<UpdateCsvResult> => {
  const cwd = options.cwd ?? process.cwd();
  const translationsDir = path.resolve(cwd, options.translationsDir);
  const usages = await collectUsages(await listSourceFiles(path.resolve(cwd, options.dir)));
  const findings = classifyUsages(usages, await loadEnglishTranslations(translationsDir), {
    includeUnused: true,
  });
  const planned = plannedUpdates(findings, options.prune);
  if (options.dry) {
    return { ...planned, dry: true };
  }
  const written = await applyCsvKeyUpdates(translationsDir, planned.addedKeys, planned.removedKeys);
  return { ...written, dry: false };
};

const color = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
};

const keyTable = (title: string, keys: string[]): string[] => {
  if (!keys.length) {
    return [];
  }
  return [
    `=== ${title} (${keys.length}) ===`,
    '| Key |',
    '| --- |',
    ...keys.map(key => `| ${key.replaceAll('|', '\\|')} |`),
    '',
  ];
};

const formatUpdateCsvReport = (result: UpdateCsvResult): string => {
  const lines = [
    ...keyTable('keys to add', result.addedKeys),
    ...keyTable(
      result.dry ? 'unused keys that --prune would remove' : 'unused keys removed',
      result.removedKeys
    ),
  ];
  if (!lines.length) {
    return `${color.green('All good!')}\n`;
  }
  if (result.dry) {
    lines.push(color.yellow('Dry run: CSV files were not written.'));
  }
  return `${lines.join('\n')}\n`;
};

const printUpdateCsvResult = (
  result: UpdateCsvResult,
  write: (text: string) => void = text => {
    process.stdout.write(text);
  }
): void => {
  write(formatUpdateCsvReport(result));
};

export {
  formatUpdateCsvReport,
  parseUpdateCsvArgs,
  printUpdateCsvResult,
  runUpdateTranslationsCsv,
  updateCsvHelpText,
};
export type { UpdateCsvOptions, UpdateCsvResult };
