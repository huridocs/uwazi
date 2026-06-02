import * as readline from 'readline';
import { Client } from '@elastic/elasticsearch';
import { config } from '#api/config.js';
import { IndexMigrationManager } from '../../app/api/core/infrastructure/elasticSearch/IndexMigrationManager.js';
import { IndexMappingRegistry } from '../../app/api/core/infrastructure/elasticSearch/IndexMappingRegistry.js';
import { MigrationScriptRunner } from '../../app/api/core/infrastructure/elasticSearch/scripts/MigrationScriptRunner.js';

const prompt = async question =>
  new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });

const USAGE =
  'Usage: MigrateIndex --index <name> --target <version> [--no-wait] [--dry-run] [--yes]';

// eslint-disable-next-line max-statements
async function main(argv = process.argv.slice(2)) {
  const indexFlag = argv.indexOf('--index');
  const targetFlag = argv.indexOf('--target');
  const noWait = argv.includes('--no-wait');
  const dryRun = argv.includes('--dry-run');
  const skipPrompt = argv.includes('--yes');

  if (indexFlag === -1 || !argv[indexFlag + 1]) {
    process.stderr.write(`Error: --index is required\n${USAGE}\n`);
    process.exit(1);
  }

  if (targetFlag === -1 || !argv[targetFlag + 1]) {
    process.stderr.write(`Error: --target is required\n${USAGE}\n`);
    process.exit(1);
  }

  const indexName = argv[indexFlag + 1];
  const targetRaw = argv[targetFlag + 1];
  const targetVersion = Number(targetRaw);

  if (!Number.isInteger(targetVersion) || targetVersion <= 0) {
    process.stderr.write(
      `Error: --target must be a positive integer, got: "${targetRaw}"\n${USAGE}\n`
    );
    process.exit(1);
  }

  if (!skipPrompt && !dryRun) {
    const answer = await prompt(
      `About to migrate index '${indexName}' to version ${targetVersion}.\n` +
        'This will reindex all documents and swap the alias. Continue? (y/N) '
    );
    if (answer !== 'y' && answer !== 'Y') {
      process.exit(0);
    }
  }

  const client = new Client({
    nodes: config.elasticsearch.nodes,
    auth: config.elasticsearch.auth,
  });

  const manager = new IndexMigrationManager({ client, registry: IndexMappingRegistry });
  const runner = new MigrationScriptRunner({ manager, registry: IndexMappingRegistry, client });

  const result = await runner.runMigration({
    indexName,
    targetVersion,
    waitForCompletion: !noWait,
    dryRun,
  });

  if (result.output) process.stdout.write(`${result.output}\n`);
  if (result.exitCode === 1 && result.error) process.stderr.write(`${result.error}\n`);
  process.exit(result.exitCode);
}

main();
