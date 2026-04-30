import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { ObjectId } from 'mongodb';
import { config } from '#api/config.js';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/index.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { MongoEntityDAO } from '#api/core/infrastructure/mongodb/entity/MongoEntityDAO.js';
import { MongoFilesDAO } from '#api/core/infrastructure/mongodb/files/MongoFilesDAO.js';
import { MongoTemplatesDAO } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDAO.js';
import { MongoSlotsDAO } from '#api/core/infrastructure/elasticSearch/entities/MongoSlotsDAO.js';
import { MongoSlotsBootstrapper } from '#api/core/infrastructure/elasticSearch/entities/MongoSlotsBootstrapper.js';
import { SlotsReconciler } from '#api/core/infrastructure/elasticSearch/entities/SlotsReconciler.js';
import { ElasticSearchClientFactory } from '#api/core/infrastructure/elasticSearch/ElasticSearchClientFactory.js';
import { EntityESWriter } from '#api/core/infrastructure/elasticSearch/entities/EntityESWriter.js';
import { FullTextESWriter } from '#api/core/infrastructure/elasticSearch/entities/FullTextESWriter.js';
import { EntityIndexerService } from '#api/core/infrastructure/elasticSearch/entities/EntityIndexerService.js';
import { FullTextIndexerService } from '#api/core/infrastructure/elasticSearch/entities/FullTextIndexerService.js';
import {
  TenantOnboarder,
  ProgressEvent,
} from '#api/core/infrastructure/elasticSearch/TenantOnboarder.js';
import { User } from '#api/users.v2/model/User.js';

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
      const db = getConnection();
      const transactionManager = TransactionManagerFactory.default() as MongoTransactionManager;
      const settingsDS = SettingsDataSourceFactory.default(transactionManager);
      const logger = LoggerFactory.default();

      const entityDAO = new MongoEntityDAO(db, transactionManager, User.createFrom(null));
      const filesDAO = new MongoFilesDAO({ db, transactionManager });

      const slotsBootstrapper = new MongoSlotsBootstrapper({ database: db });
      const templatesDAO = new MongoTemplatesDAO({ db, transactionManager });
      const slotsDAO = new MongoSlotsDAO({
        db,
        transactionManager,
        tenantName: tenant,
        settingsDS,
      });
      const slotsReconciler = new SlotsReconciler({ slotsDAO, templatesDAO });

      const tenantAwareClient = ElasticSearchClientFactory.tenantAware(tenant);
      const entityWriter = new EntityESWriter({ esClient: tenantAwareClient, slotsDAO });
      const fullTextWriter = new FullTextESWriter({ esClient: tenantAwareClient });
      const entityIndexer = new EntityIndexerService({ writer: entityWriter, entityDAO });
      const fullTextIndexer = new FullTextIndexerService({ writer: fullTextWriter, filesDAO });

      const onboarder = new TenantOnboarder({
        entityIndexer,
        fullTextIndexer,
        slotsBootstrapper,
        slotsReconciler,
        transactionManager,
        logger,
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
