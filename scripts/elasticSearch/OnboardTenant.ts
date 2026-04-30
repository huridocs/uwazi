import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { ObjectId } from 'mongodb';
import { config } from '#api/config.js';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/index.js';
import { ElasticSearchClientFactory } from '#api/core/infrastructure/elasticSearch/ElasticSearchClientFactory.js';
import { ProgressEvent } from '#api/core/infrastructure/elasticSearch/TenantOnboarder.js';
import { TenantOnboarderFactory } from '#api/core/infrastructure/factories/TenantOnboarderFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';

const { tenant, resumeFromEntity, resumeFromFile } = yargs(hideBin(process.argv))
  .option('tenant', {
    alias: 't',
    type: 'string',
    describe: 'Tenant name to onboard',
    demandOption: true,
  })
  .option('resume-from-entity', {
    type: 'string',
    describe: 'Resume entity indexing after this sharedId checkpoint',
  })
  .option('resume-from-file', {
    type: 'string',
    describe: 'Resume fulltext indexing after this file ObjectId checkpoint',
  })
  .parseSync();

const formatProgress = (event: ProgressEvent): string => {
  switch (event.stage) {
    case 'bootstrap-slots':
      return '[bootstrap-slots]';
    case 'reconcile-slots':
      return '[reconcile-slots]';
    case 'index-entities':
      return `[index-entities] indexed=${event.indexed}   checkpoint-entity=${event.lastSharedId}\r\n`;
    case 'index-fulltext':
      return `[index-fulltext] indexed=${event.indexed}   checkpoint-file=${event.lastFileId}\r\n`;
    case 'catch-up':
      return `[catch-up] indexed=${event.indexed}\r\n`;
    case 'done':
      return '[done]';
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
      ExecutionContext.attachSyncContext(TenantOnboarderFactory, 'default', {
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

      const onboarder = TenantOnboarderFactory.default({
        onProgress: event => {
          const message = formatProgress(event);
          if (message) {
            process.stdout.write(`${message}\n`);
          }
        },
      });

      const resumeFrom =
        resumeFromEntity || resumeFromFile
          ? {
              entitySharedId: resumeFromEntity,
              fileId: resumeFromFile ? new ObjectId(resumeFromFile) : undefined,
            }
          : undefined;

      await onboarder.execute(resumeFrom);
    }, tenant);

    const [seconds, nanoseconds] = process.hrtime(start);
    const elapsed = (seconds + nanoseconds / 1e9).toFixed(1);
    process.stdout.write(`Done. Took ${elapsed}s\n`);
  } catch (err) {
    console.error('Tenant onboarding failed:', err);
    process.exitCode = 1;
  } finally {
    await ElasticSearchClientFactory.getInstance().close();
    await tenants.model?.closeChangeStream();
    await DB.disconnect();
  }
}

main();
