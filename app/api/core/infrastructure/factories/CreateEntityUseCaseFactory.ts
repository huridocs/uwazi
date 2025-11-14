import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { CreateEntityUseCase } from 'api/core/application/CreateEntity';
import { FileStorageStrategyFactory } from 'api/files.v2/infrastructure/FileStorageStrategyFactory';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { MongoThesauriDataSource } from '../mongodb/thesauri/MongoThesauriDS';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { FilesService } from 'api/core/application/FilesService';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';

class CreateEntityUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const idGenerator = IdGeneratorFactory.default();
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
    const fileStorage = FileStorageStrategyFactory.createDefault();
    const filesDS = DefaultFilesDataSource(transactionManager);
    const thesauriDS = new MongoThesauriDataSource(getConnection(), transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
    const multiLanguageEntityDS = new MongoMultiLanguageEntityDataSource(
      getConnection(),
      transactionManager
    );

    const useCase = new CreateEntityUseCase(
      {
        fileService: new FilesService({
          idGenerator,
          filesDS,
          fileStorage,
          jobsDispatcher: DefaultDispatcher(tenants.current().name),
        }),
        idGenerator,
        templatesDS,
        thesauriDS,
        settingsDS,
        transactionManager,
        multiLanguageEntityDS,
        translationsDS,
        eventBus: applicationEventsBus,
      },
      { actor: permissionsContext.getUserInContext()!, tenant: tenants.current() }
    );

    return useCase;
  }
}

export { CreateEntityUseCaseFactory };
