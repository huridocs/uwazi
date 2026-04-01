import { Client } from '@elastic/elasticsearch';
import { config } from '#api/config.js';
import { IndexMigrationManager } from '../../app/api/core/infrastructure/elasticSearch/IndexMigrationManager.js';
import { IndexMappingRegistry } from '../../app/api/core/infrastructure/elasticSearch/IndexMappingRegistry.js';
import { MigrationScriptRunner } from '../../app/api/core/infrastructure/elasticSearch/scripts/MigrationScriptRunner.js';

async function main(argv = process.argv.slice(2)) {
  const json = argv.includes('--json');

  const client = new Client({
    nodes: config.elasticsearch.nodes,
    auth: config.elasticsearch.auth,
  });

  const manager = new IndexMigrationManager({ client, registry: IndexMappingRegistry });
  const runner = new MigrationScriptRunner({ manager, registry: IndexMappingRegistry, client });

  try {
    const result = await runner.runList({ json });
    if (result.output) process.stdout.write(`${result.output}\n`);
    process.exit(result.exitCode);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
}

main();
