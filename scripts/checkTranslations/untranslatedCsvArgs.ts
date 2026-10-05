type UntranslatedCsvOptions = {
  translationsDir: string;
  contextFile: string;
  locales: string[];
  onlyNew: boolean;
  limit: number;
  cwd?: string;
};

const BOOLEAN_FLAGS: Record<string, 'onlyNew'> = {
  '--only-new': 'onlyNew',
};

const PATH_OPTION_BY_FLAG: Record<string, 'translationsDir' | 'contextFile'> = {
  '--translations-dir': 'translationsDir',
  '--context-file': 'contextFile',
};

const defaultOptions = (): UntranslatedCsvOptions => ({
  translationsDir: 'contents/ui-translations',
  contextFile: 'contents/translation-context.csv',
  locales: [],
  onlyNew: false,
  limit: 0,
});

type FlagValueInput = {
  arg: string;
  argv: string[];
  index: number;
  consumed: Set<number>;
};

const takeFlagValue = ({ arg, argv, index, consumed }: FlagValueInput): string => {
  const [, inline] = arg.split('=');
  if (inline !== undefined) {
    return inline;
  }
  consumed.add(index + 1);
  return argv[index + 1];
};

type PathFlagInput = FlagValueInput & {
  options: UntranslatedCsvOptions;
};

const applyPathFlag = ({ options, arg, argv, index, consumed }: PathFlagInput): boolean => {
  const [flag] = arg.split('=');
  const key = PATH_OPTION_BY_FLAG[flag];
  if (!key) {
    return false;
  }
  options[key] = takeFlagValue({ arg, argv, index, consumed });
  return true;
};

const applyValueFlag = ({ options, arg, argv, index, consumed }: PathFlagInput): boolean => {
  const [flag] = arg.split('=');
  if (flag === '--locales') {
    options.locales = takeFlagValue({ arg, argv, index, consumed })
      .split(',')
      .map(locale => locale.trim())
      .filter(Boolean);
    return true;
  }
  if (flag === '--limit') {
    options.limit = Number(takeFlagValue({ arg, argv, index, consumed }));
    return true;
  }
  return false;
};

const parseUntranslatedCsvArgs = (argv: string[]): UntranslatedCsvOptions => {
  const options = defaultOptions();
  const consumed = new Set<number>();
  argv.forEach((arg, index, all) => {
    if (consumed.has(index) || arg === '--help' || arg === '-h') {
      return;
    }
    const boolKey = BOOLEAN_FLAGS[arg];
    if (boolKey) {
      options[boolKey] = true;
      return;
    }
    const handled =
      applyPathFlag({ options, arg, argv: all, index, consumed }) ||
      applyValueFlag({ options, arg, argv: all, index, consumed });
    if (!handled) {
      throw new Error(`Unknown argument: ${arg}`);
    }
  });
  return options;
};

const untranslatedCsvHelpText = `Usage: yarn check-untranslated-csv [--only-new] [--limit N] [--locales es,fr] [--translations-dir <path>] [--context-file <path>]

Lists System UI CSV keys whose locale value is still English.

  --only-new            Only keys that are still English in every selected locale
                        (the leftover from yarn update-translations-csv).
  --limit N             Cap unique keys (for translating a small batch).
  --locales             Comma-separated locale codes (default: all except en).
  --translations-dir    Locale CSV directory (default: contents/ui-translations)
  --context-file        Translator brief CSV (default: contents/translation-context.csv)

Does not overwrite CSV values. Not run in CI — fill translations in the PR.
Exit code 1 when there is anything left to translate.
`;

export { parseUntranslatedCsvArgs, untranslatedCsvHelpText };
export type { UntranslatedCsvOptions };
