import { createInterface } from 'readline';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { ElasticSearchClientFactory } from '#api/core/infrastructure/elasticSearch/ElasticSearchClientFactory.js';
import { ElasticSearchBootstrapper } from '#api/core/infrastructure/elasticSearch/provision/ElasticSearchBootstrapper.js';
import { IndexMappingRegistry } from '#api/core/infrastructure/elasticSearch/IndexMappingRegistry.js';
import { config } from '#api/config.js';

function promptConfirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

async function main() {
  try {
    const { nodes, requestTimeout, auth } = config.elasticsearch;
    const apiKeySet = Boolean(auth?.apiKey);

    console.log('\n--- ElasticSearch Client Config ---');
    console.log(
      `  ELASTICSEARCH_URL  : ${process.env.ELASTICSEARCH_URL ?? '(not set, default: http://localhost:9200)'}`
    );
    console.log(`  Resolved nodes     : ${nodes.join(', ')}`);
    console.log(`  Request timeout    : ${requestTimeout}ms`);
    console.log(`  ELASTICSEARCH_API_KEY : ${apiKeySet ? '(set)' : '(not set)'}`);
    console.log('-----------------------------------\n');

    const proceed = await promptConfirm('Proceed with these settings? [y/N] ');
    if (!proceed) {
      console.log('Aborted.');
      console.log(
        "To override:  ELASTICSEARCH_URL='http://...' ELASTICSEARCH_API_KEY='your-key' yarn es:create:indexes"
      );
      return;
    }

    const logger = LoggerFactory.systemLogger();

    const esClient = ElasticSearchClientFactory.getInstance();
    const esBootstrapper = new ElasticSearchBootstrapper({
      client: esClient,
      registry: IndexMappingRegistry,
      logger,
    });

    await esBootstrapper.execute();
  } catch (err) {
    console.error('ES index rebuild failed:', err);
    process.exitCode = 1;
  } finally {
    await ElasticSearchClientFactory.getInstance().close();
  }
}

main();
