import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { UpdateTemplateUseCase } from '#api/core/application/UpdateTemplate.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DefaultRelationshipTypesDataSource } from '#api/relationshiptypes.v2/database/data_source_defaults.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { TemplateUpdateDenormalizeEntitiesBatch } from '#api/core/application/TemplateUpdateDenormalizeEntitiesBatch.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { LegacyTranslationService } from '#api/core/infrastructure/mongodb/template/LegacyTemplatesTranslationService.js';
import { MongoThesauriDataSource } from '#api/core/infrastructure/mongodb/thesauri/MongoThesauriDS.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { MongoRelationshipsV1DataSource } from '#api/relationships/MongoRelationshipsV1DataSource.js';
import { TemplatePostProcessEntitiesJob } from '#api/core/infrastructure/jobs/TemplatePostProcessEntitiesJob.js';

class UpdateTemplateUseCaseFactory {
  static async create() {
    const transactionManager = TransactionManagerFactory.default();
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
    const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);
    const thesauriDS = new MongoThesauriDataSource(getConnection(), transactionManager);
    const translationService = new LegacyTranslationService();
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);
    const idGenerator = IdGeneratorFactory.default();
    const eventBus = applicationEventsBus;
    const filesDS = FilesDataSourceFactory.default(transactionManager);
    const relationshipsV1DS = new MongoRelationshipsV1DataSource(
      getConnection(),
      transactionManager
    );

    let jobsDispatcher: JobsDispatcher = new SyncDispatcherForTests({
      TemplatePostProcessEntitiesJob: async () =>
        new TemplatePostProcessEntitiesJob({
          useCase: new TemplateUpdateDenormalizeEntitiesBatch({
            entitiesDS,
            relationshipsV1DS,
            templatesDS,
            transactionManager,
            filesDS,
          }),
          templatesDS,
        }),
    });

    if (process.env.NODE_ENV !== 'test') {
      jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);
    }

    const useCase = new UpdateTemplateUseCase(
      {
        idGenerator,
        eventBus,
        transactionManager,
        templatesDS,
        entitiesDS,
        thesauriDS,
        translationService,
        settingsDS,
        relationshipTypesDS,
        jobsDispatcher,
      },
      { actor: permissionsContext.getUserInContext()!, tenant: tenants.current() }
    );

    return useCase;
  }
}

export { UpdateTemplateUseCaseFactory };
