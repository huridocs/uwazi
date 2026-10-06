import { ListenerManifestGenerator } from './ListenerManifestGenerator.js';
import { PrettierSourceFormatter } from './PrettierSourceFormatter.js';

/**
 * `yarn generate-listeners` writes the V2 listener manifests; `--check` only reports stale ones
 * and exits 1, for lint.
 */
const generator = new ListenerManifestGenerator(
  process.cwd(),
  [
    { root: 'app/api', output: 'app/api/listeners.generated.ts' },
    {
      root: 'packages/segmentation',
      output: 'packages/segmentation/infrastructure/listeners.generated.ts',
    },
    { root: 'packages/ocr', output: 'packages/ocr/infrastructure/listeners.generated.ts' },
  ],
  PrettierSourceFormatter.format
);

const run = async (check: boolean) => {
  if (!check) {
    await generator.write();
    return 0;
  }
  const stale = await generator.stale();
  if (stale.length) {
    process.stderr.write(
      `Listener manifests are stale: ${stale.join(', ')}. Run \`yarn generate-listeners\`.\n`
    );
    return 1;
  }
  return 0;
};

run(process.argv.includes('--check')).then(
  code => process.exit(code),
  error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
);
