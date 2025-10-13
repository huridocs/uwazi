import {
  DefaultIdGenerator,
  DefaultTransactionManager,
} from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { UpdateTemplateUseCase } from 'api/core/application/UpdateTemplate';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { applicationEventsBus } from 'api/eventsbus';
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
    const transactionManager = DefaultTransactionManager();
    const templatesDS = DefaultTemplatesDataSource(transactionManager);
    const entitiesDS = new MongoMultiLanguageEntityDataSource(
      getConnection(),
      transactionManager,
      templatesDS
    );
    const thesauriDS = new MongoThesauriDataSource();
    const translationService = new LegacyTranslationService();
    const settingsDS = DefaultSettingsDataSource(transactionManager);
    const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);
    const idGenerator = DefaultIdGenerator;
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
