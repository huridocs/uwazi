import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { CreateThesaurusUseCase } from '#api/core/application/CreateThesaurus.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { DefaultDispatcher } from '#api/queue.v2/configuration/factories.js';
import { tenants } from '#api/tenants/index.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory';

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
      jobsDispatcher: DefaultDispatcher(tenants.current().name, transactionManager),
    });

    const useCase = new CreateThesaurusUseCase({
      transactionManager,
      thesauriService,
    });

    return useCase;
  }
}

export { CreateThesaurusUseCaseFactory };
