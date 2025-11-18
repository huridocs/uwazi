import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { UpdateTemplateUseCase } from 'api/core/application/UpdateTemplate';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import { SyncDispatcherForTests } from 'api/core/libs/queue/infrastructure/SyncDispatcherForTests';
import { TemplateUpdateDenormalizeEntitiesBatch } from 'api/core/application/TemplateUpdateDenormalizeEntitiesBatch';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { MongoRelationshipsV1DataSource } from 'api/relationships/MongoRelationshipsV1DataSource';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { LegacyTranslationService } from '../mongodb/template/LegacyTemplatesTranslationService';
import { MongoThesauriDataSource } from '../mongodb/thesauri/MongoThesauriDS';
import { TemplatePostProcessEntitiesJob } from '../jobs/TemplatePostProcessEntitiesJob';

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
    const filesDS = DefaultFilesDataSource(transactionManager);
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
      jobsDispatcher = await DefaultDispatcher(tenants.current().name);
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
