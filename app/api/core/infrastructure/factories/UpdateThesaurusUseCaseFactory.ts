import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { ThesaurusTranslationService } from 'api/core/application/thesaurusTranslationService/ThesaurusTranslationService';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { UpdateThesaurusUseCase } from 'api/core/application/UpdateThesaurus';
import { tenants } from 'api/tenants/tenantContext';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { MongoThesauriDataSourceV2 } from '../mongodb/thesauri/MongoThesauriDataSourceV2';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory';

class UpdateThesaurusUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const thesauriDS = new MongoThesauriDataSourceV2(getConnection(), transactionManager);

    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);

    const thesaurusTranslationService = new ThesaurusTranslationService({
      settingsDS,
      translationsDS,
    });

    const jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);

    const useCase = new UpdateThesaurusUseCase(
      {
        transactionManager,
        thesauriDS,
        thesaurusTranslationService,
        jobsDispatcher,
      },
      { tenant: tenants.current(), actor: permissionsContext.getUserInContext()! }
    );

    return useCase;
  }
}

export { UpdateThesaurusUseCaseFactory };
