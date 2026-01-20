import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DeleteTemplateUseCase } from '#api/core/application/DeleteTemplate.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { DefaultEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/index.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { TemplateUpdateDenormalizeEntitiesBatch } from '#api/core/application/TemplateUpdateDenormalizeEntitiesBatch.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { TemplatePostProcessEntitiesJob } from '#api/core/infrastructure/jobs/TemplatePostProcessEntitiesJob.js';

class DeleteTemplateUseCaseFactory {
  static async create() {
    const eventBus = applicationEventsBus;
    const transactionManager = TransactionManagerFactory.default();
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
    const entitiesDS = DefaultEntitiesDataSource(transactionManager);
    const multiLanguageEntitiesDS = new MongoMultiLanguageEntityDataSource(
      getConnection(),
      transactionManager
    );
    const filesDS = FilesDataSourceFactory.default(transactionManager);
    const relationshipsV1DS = new MongoRelationshipsV1DataSource(
      getConnection(),
      transactionManager
    );
    let jobsDispatcher: JobsDispatcher = new SyncDispatcherForTests({
      TemplatePostProcessEntitiesJob: async () =>
        new TemplatePostProcessEntitiesJob({
          useCase: new TemplateUpdateDenormalizeEntitiesBatch({
            entitiesDS: multiLanguageEntitiesDS,
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

    const useCase = new DeleteTemplateUseCase(
      {
        eventBus,
        transactionManager,
        entitiesDS,
        templatesDS,
        settingsDS,
        translationsDS,
        multiLanguageEntitiesDS,
        jobsDispatcher,
      },
      { actor: permissionsContext.getUserInContext()!, tenant: tenants.current() }
    );

    return useCase;
  }
}

export { DeleteTemplateUseCaseFactory };
