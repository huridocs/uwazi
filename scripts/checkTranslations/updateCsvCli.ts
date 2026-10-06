import {
  parseUpdateCsvArgs,
  printUpdateCsvResult,
  runUpdateTranslationsCsv,
  updateCsvHelpText,
} from './updateCsv.js';

const main = async () => {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${updateCsvHelpText}\n`);
    return;
  }

  const options = parseUpdateCsvArgs(argv);
  const result = await runUpdateTranslationsCsv(options);
  printUpdateCsvResult(result);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
