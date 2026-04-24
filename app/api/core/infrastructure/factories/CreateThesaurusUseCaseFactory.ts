import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { CreateThesaurusUseCase } from '#api/core/application/CreateThesaurus.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { DispatcherAdapter } from '#api/core/infrastructure/jobs/DispatcherAdapter.js';
import { tenants } from '#api/tenants/index.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';

class CreateThesaurusUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const thesauriDS = ThesauriDataSourceFactory.default(transactionManager);

    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);

    const thesaurusTranslationService = new ThesaurusTranslationService({
      settingsDS,
      translationsDS,
    });

    const thesauriService = new ThesauriService({
      thesauriDS,
      thesaurusTranslationService,
      dispatcher: new DispatcherAdapter(
        DefaultDispatcher(tenants.current().name, transactionManager)
      ),
    });

    const useCase = new CreateThesaurusUseCase({
      transactionManager,
      thesauriService,
    });

    return useCase;
  }
}

export { CreateThesaurusUseCaseFactory };
