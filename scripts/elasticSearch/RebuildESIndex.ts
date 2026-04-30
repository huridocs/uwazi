import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
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
import { ElasticSearchBootstrapper } from '#api/core/infrastructure/elasticSearch/provision/ElasticSearchBootstrapper.js';
import { EntityESWriter } from '#api/core/infrastructure/elasticSearch/entities/EntityESWriter.js';
import { FullTextESWriter } from '#api/core/infrastructure/elasticSearch/entities/FullTextESWriter.js';
import { EntityIndexerService } from '#api/core/infrastructure/elasticSearch/entities/EntityIndexerService.js';
import { FullTextIndexerService } from '#api/core/infrastructure/elasticSearch/entities/FullTextIndexerService.js';
import { IndexMappingRegistry } from '#api/core/infrastructure/elasticSearch/IndexMappingRegistry.js';
import {
  ESIndexRebuilder,
  ProgressEvent,
} from '#api/core/infrastructure/elasticSearch/ESIndexRebuilder.js';
import { User } from '#api/users.v2/model/User.js';

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

      const esClient = ElasticSearchClientFactory.getInstance();
      const tenantAwareClient = ElasticSearchClientFactory.tenantAware(tenant);
      const esBootstrapper = new ElasticSearchBootstrapper({
        client: esClient,
        registry: IndexMappingRegistry,
        logger,
      });
      const entityWriter = new EntityESWriter({ esClient: tenantAwareClient });
      const fullTextWriter = new FullTextESWriter({ esClient: tenantAwareClient });
      const entityIndexer = new EntityIndexerService({
        writer: entityWriter,
        entityDAO,
        slotsDAO,
        maxConcurrentWrites: 10,
      });
      const fullTextIndexer = new FullTextIndexerService({
        writer: fullTextWriter,
        filesDAO,
        maxConcurrentWrites: 10,
      });

      const rebuilder = new ESIndexRebuilder({
        transactionManager,
        esClient,
        esBootstrapper,
        entityIndexer,
        fullTextIndexer,
        slotsBootstrapper,
        slotsReconciler,
        registry: IndexMappingRegistry,
        logger,
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
