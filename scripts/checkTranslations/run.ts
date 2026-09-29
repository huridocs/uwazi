import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { applySourceFixes } from './applyFixes.js';
import { classifyUsages } from './classify.js';
import { extractUsages } from './extractUsages.js';
import { addMissingKeysToCsvs, loadEnglishTranslations } from './translations.js';
import type { CheckTranslationsOptions, CheckTranslationsResult, Finding } from './types.js';
import { listSourceFiles } from './walkFiles.js';

const KIND_ORDER: Finding['kind'][] = [
  'unwrapped-jsx-text',
  'missing-key',
  'untranslated-attribute',
  'untranslated-notify',
  'untranslated-label',
  'composed-string',
  'unused-key',
];

const BOOLEAN_FLAGS: Record<
  string,
  keyof Pick<CheckTranslationsOptions, 'fix' | 'strict' | 'unused'>
> = {
  '--fix': 'fix',
  '--strict': 'strict',
  '--unused': 'unused',
};

const PATH_OPTION_BY_FLAG: Record<string, 'dir' | 'translationsDir'> = {
  '--dir': 'dir',
  '--translations-dir': 'translationsDir',
};

const applyBooleanFlag = (options: CheckTranslationsOptions, arg: string): boolean => {
  const flag = BOOLEAN_FLAGS[arg];
  if (!flag) {
    return false;
  }
  options[flag] = true;
  return true;
};

type PathFlagInput = {
  options: CheckTranslationsOptions;
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

const isHelpFlag = (arg: string): boolean => arg === '--help' || arg === '-h';

const parseArgs = (argv: string[]): CheckTranslationsOptions => {
  const options: CheckTranslationsOptions = {
    dir: './app',
    translationsDir: 'contents/ui-translations',
    fix: false,
    strict: false,
    unused: false,
  };
  const consumed = new Set<number>();
  argv.forEach((arg, index, all) => {
    const handled =
      consumed.has(index) ||
      applyBooleanFlag(options, arg) ||
      isHelpFlag(arg) ||
      applyPathFlag({ options, arg, argv: all, index, consumed });
    if (handled) {
      return;
    }
    throw new Error(`Unknown argument: ${arg}`);
  });
  return options;
};

const helpText = `Usage: yarn check-translations [--fix] [--strict] [--unused] [--dir <path>] [--translations-dir <path>]

Checks System UI copy against contents/ui-translations.

  --fix                 Wrap static JSX text / native attributes / notify() calls and
                        add missing keys to locale CSVs. Leaves composed strings and
                        option-label maps for a human.
  --strict              Fail on warnings as well as errors.
  --unused              Also report CSV keys that are never looked up or found as UI copy.
  --dir                 Source root to scan (default: ./app)
  --translations-dir    Locale CSV directory (default: contents/ui-translations)

Not flagged: entity/template/thesaurus copy (separate translation system),
member expressions such as entity.title, no-translate subtrees, tests/stories.
`;

const relativeFile = (file: string, cwd: string): string => {
  const rel = path.relative(cwd, file);
  return rel.startsWith('..') ? file : rel;
};

const groupByFile = (findings: Finding[]): Map<string, Finding[]> => {
  const grouped = new Map<string, Finding[]>();
  findings.forEach(finding => {
    if (!finding.file || !finding.loc) {
      return;
    }
    const current = grouped.get(finding.file) ?? [];
    current.push(finding);
    grouped.set(finding.file, current);
  });
  return grouped;
};

const applyFixes = async (
  findings: Finding[],
  translationsDir: string
): Promise<{ fixed: Finding[]; leftover: Finding[]; addedKeys: string[] }> => {
  const grouped = groupByFile(findings);
  const fixed: Finding[] = [];
  const leftover: Finding[] = findings.filter(finding => !finding.file || !finding.loc);

  await Promise.all(
    [...grouped.entries()].map(async ([file, fileFindings]) => {
      const source = await readFile(file, 'utf8');
      const result = applySourceFixes(source, fileFindings);
      leftover.push(...result.leftover);
      if (result.applied.length && result.source !== source) {
        await writeFile(file, result.source);
        fixed.push(...result.applied);
      } else {
        leftover.push(...result.applied);
      }
    })
  );

  const keysToAdd = [
    ...findings.filter(finding => finding.kind === 'missing-key').map(finding => finding.key),
    ...fixed.map(finding => finding.key),
  ];
  const addedKeys = await addMissingKeysToCsvs(translationsDir, keysToAdd);
  const leftoverWithoutAddedKeys = leftover.filter(
    finding => finding.kind !== 'missing-key' || !addedKeys.includes(finding.key)
  );

  return { fixed, leftover: leftoverWithoutAddedKeys, addedKeys };
};

const color = {
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
};

const formatReport = (
  findings: Finding[],
  extras: { fixed: Finding[]; addedKeys: string[] }
): string => {
  const lines: string[] = [];
  KIND_ORDER.forEach(kind => {
    const ofKind = findings.filter(finding => finding.kind === kind);
    if (!ofKind.length) {
      return;
    }
    const tone = ofKind[0].severity === 'error' ? color.red : color.yellow;
    lines.push(` === ${tone(kind)} (${ofKind[0].severity}) ${ofKind.length} ===`);
    ofKind.forEach(finding => {
      const location = finding.loc ? `:${finding.loc.line}` : '';
      const file = finding.file ? `${finding.file}${location}` : '(csv)';
      const unfixable = finding.fixable ? '' : color.dim('  [not auto-fixable]');
      lines.push(` ${color.cyan(file)}  ${finding.text}${unfixable}`);
    });
    lines.push('');
  });

  if (extras.fixed.length) {
    lines.push(color.green(` Applied ${extras.fixed.length} source fix(es).`));
  }
  if (extras.addedKeys.length) {
    lines.push(color.green(` Added ${extras.addedKeys.length} missing key(s) to locale CSVs.`));
  }
  return `${lines.join('\n')}\n`;
};

const relativize = (findings: Finding[], cwd: string): Finding[] =>
  findings.map(finding => ({
    ...finding,
    file: finding.file ? relativeFile(finding.file, cwd) : finding.file,
  }));

const collectUsages = async (files: string[]) =>
  (
    await Promise.all(
      files.map(async file => {
        const source = await readFile(file, 'utf8');
        return extractUsages(source, file);
      })
    )
  ).flat();

type AppliedFixes = {
  leftover: Finding[];
  fixed: Finding[];
  addedKeys: string[];
};

const toResult = (applied: AppliedFixes, cwd: string, strict: boolean): CheckTranslationsResult => {
  const leftover = relativize(applied.leftover, cwd);
  const fixed = relativize(applied.fixed, cwd);
  const errors = leftover.filter(finding => finding.severity === 'error');
  const warnings = leftover.filter(finding => finding.severity === 'warning');
  const exitCode = errors.length || (strict && warnings.length) ? 1 : 0;
  return {
    findings: leftover,
    errors,
    warnings,
    fixed,
    leftover,
    addedKeys: applied.addedKeys,
    exitCode,
  };
};

const runCheckTranslations = async (
  options: CheckTranslationsOptions
): Promise<CheckTranslationsResult> => {
  const cwd = options.cwd ?? process.cwd();
  const translationsDir = path.resolve(cwd, options.translationsDir);
  const files = await listSourceFiles(path.resolve(cwd, options.dir));
  const usages = await collectUsages(files);
  const translations = await loadEnglishTranslations(translationsDir);
  const findings = classifyUsages(usages, translations, { includeUnused: options.unused });
  const applied = options.fix
    ? await applyFixes(findings, translationsDir)
    : { leftover: findings, fixed: [], addedKeys: [] };
  return toResult(applied, cwd, options.strict);
};

const printResult = (
  result: CheckTranslationsResult,
  write: (text: string) => void = text => {
    process.stdout.write(text);
  }
): void => {
  if (!result.findings.length && !result.fixed.length && !result.addedKeys.length) {
    write(color.green(' All good! \n'));
    return;
  }
  write(formatReport(result.findings, { fixed: result.fixed, addedKeys: result.addedKeys }));
  const summary = ` ${result.errors.length} error(s), ${result.warnings.length} warning(s).`;
  write(`${result.exitCode ? color.red(summary) : color.yellow(summary)}\n`);
};

export { formatReport, helpText, parseArgs, printResult, runCheckTranslations };
