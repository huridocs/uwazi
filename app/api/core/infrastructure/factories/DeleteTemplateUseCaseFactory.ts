import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DeleteTemplateUseCase } from 'api/core/application/DeleteTemplate';
import { applicationEventsBus } from 'api/eventsbus';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { SyncDispatcherForTests } from 'api/core/libs/queue/infrastructure/SyncDispatcherForTests';
import { TemplateUpdateDenormalizeEntitiesBatch } from 'api/core/application/TemplateUpdateDenormalizeEntitiesBatch';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { MongoRelationshipsV1DataSource } from 'api/relationships/MongoRelationshipsV1DataSource';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { TemplatePostProcessEntitiesJob } from '../jobs/TemplatePostProcessEntitiesJob';

class DeleteTemplateUseCaseFactory {
  static async create() {
    const eventBus = applicationEventsBus;
    const transactionManager = DefaultTransactionManager();
    const templatesDS = DefaultTemplatesDataSource(transactionManager);
    const settingsDS = DefaultSettingsDataSource(transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
    const entitiesDS = DefaultEntitiesDataSource(transactionManager);
    const multiLanguageEntitiesDS = new MongoMultiLanguageEntityDataSource(
      getConnection(),
      transactionManager,
      templatesDS
    );
    const filesDS = DefaultFilesDataSource(transactionManager);
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
      jobsDispatcher = await DefaultDispatcher(tenants.current().name);
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
