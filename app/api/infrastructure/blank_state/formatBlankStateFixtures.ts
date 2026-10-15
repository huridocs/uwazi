// eslint-disable-next-line no-restricted-imports
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

/**
 * Post-formats dumped fixture files so the committed fixtures are deterministic and
 * Prettier-clean. Only used by dump paths (the standalone script and the CLI `dump`
 * command), never by restore: restoring parses the JSON and does not care about layout.
 *
 * Prettier is loaded lazily so specs can inject a stub and never load it under Jest
 * (its CJS entry uses a dynamic import the Jest VM does not support).
 */
async function formatBlankStateFixtures(dataDir: string, tables: string[]): Promise<void> {
  const { format } = await import('prettier');
  await Promise.all(
    tables.map(async table => {
      const filePath = path.join(dataDir, `${table}.json`);
      const raw = readFileSync(filePath, 'utf-8');
      writeFileSync(filePath, await format(raw, { parser: 'json', filepath: filePath }));
    })
  );
}

export { formatBlankStateFixtures };
