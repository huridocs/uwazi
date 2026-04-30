import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { config } from '#api/config.js';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/index.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { ElasticSearchClientFactory } from '#api/core/infrastructure/elasticSearch/ElasticSearchClientFactory.js';
import { ProgressEvent } from '#api/core/infrastructure/elasticSearch/ESIndexRebuilder.js';
import { ESIndexRebuilderFactory } from '#api/core/infrastructure/factories/ESIndexRebuilderFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';

const { tenant } = yargs(hideBin(process.argv))
  .option('tenant', {
    alias: 't',
    type: 'string',
    describe: 'Tenant name to rebuild the index for',
    default: config.defaultTenant.name,
  })
  .parseSync();

const formatProgress = (event: ProgressEvent): string => {
  switch (event.stage) {
    case 'reset-indexes':
      return '[1/4] Resetting ES indexes (delete + recreate)...\n';
    case 'reset-slots':
      return '[2/4] Wiping and re-seeding slot collection...\n';
    case 'reconcile-slots':
      return '[3/4] Reconciling slots with templates...\n';
    case 'indexing':
      return `[4/4] Entities: ${event.entitiesIndexed} | Full-text: ${event.fullTextIndexed} indexed\r`;
    case 'done':
      return '\n';
    default:
      return '';
  }
};

async function main() {
  await DB.connect(config.DBHOST, config.DBAUTH);
  await tenants.setupTenants();

  const start = process.hrtime();

  try {
    await tenants.run(async () => {
      ExecutionContext.attachSyncContext(ESIndexRebuilderFactory, 'default', {
        tenant: tenants.current(),
        factories: {
          transactionManager: TransactionManagerFactory.default,
          jobsDispatcher: () =>
            DefaultDispatcher(ExecutionContext.tenant.name, ExecutionContext.transactionManager),
          eventEmitter: EventEmitterFactory.default,
          idGenerator: IdGeneratorFactory.default,
          logger: LoggerFactory.default,
          elasticClient: ElasticSearchClientFactory.tenantAware,
          authorizedEntityESClient: ElasticSearchClientFactory.authorizedEntityClient,
        },
      });

      const rebuilder = ESIndexRebuilderFactory.default({
        onProgress: event => {
          const message = formatProgress(event);
          if (message) {
            process.stdout.write(message);
          }
        },
      });

      await rebuilder.execute();
    }, tenant);

    const [seconds, nanoseconds] = process.hrtime(start);
    const elapsed = (seconds + nanoseconds / 1e9).toFixed(1);
    console.log(`Done. Took ${elapsed}s`);
  } catch (err) {
    console.log('ES index rebuild failed:', err);
    process.exitCode = 1;
  } finally {
    await ElasticSearchClientFactory.getInstance().close();
    await tenants.model?.closeChangeStream();
    await DB.disconnect();
  }
}

main();
