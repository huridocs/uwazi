import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { ThesaurusTranslationService } from 'api/core/application/thesaurusTranslationService/ThesaurusTranslationService';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { UpdateThesaurusUseCase } from 'api/core/application/UpdateThesaurus';
import { tenants } from 'api/tenants/tenantContext';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { ThesauriService } from 'api/core/application/ThesauriService';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory';

class UpdateThesaurusUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const thesauriDS = ThesauriDataSourceFactory.default(transactionManager);

    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);

    const thesaurusTranslationService = new ThesaurusTranslationService({
      settingsDS,
      translationsDS,
    });

    const jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);

    const thesauriService = new ThesauriService({
      jobsDispatcher,
      thesauriDS,
      thesaurusTranslationService,
    });

    const useCase = new UpdateThesaurusUseCase(
      {
        transactionManager,
        thesauriDS,
        thesaurusTranslationService,
        jobsDispatcher,
        thesauriService,
      },
      { tenant: tenants.current(), actor: permissionsContext.getUserInContext()! }
    );

    return useCase;
  }
}

export { UpdateThesaurusUseCaseFactory };
