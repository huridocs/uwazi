import { helpText, parseArgs, printResult, runCheckTranslations } from './run.js';

const main = async () => {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${helpText}\n`);
    return;
  }

  const options = parseArgs(argv);
  const result = await runCheckTranslations(options);
  printResult(result);
  process.exit(result.exitCode);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
