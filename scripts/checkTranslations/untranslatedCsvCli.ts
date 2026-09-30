import {
  findUntranslatedCsv,
  parseUntranslatedCsvArgs,
  printUntranslatedCsvResult,
  untranslatedCsvHelpText,
} from './untranslatedCsv.js';

const main = async () => {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${untranslatedCsvHelpText}\n`);
    return;
  }

  const result = await findUntranslatedCsv(parseUntranslatedCsvArgs(argv));
  printUntranslatedCsvResult(result);
  process.exit(result.exitCode);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
