import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { CreateThesaurusUseCase } from 'api/core/application/CreateThesaurus';
import { ThesaurusTranslationService } from 'api/core/application/thesaurusTranslationService/ThesaurusTranslationService';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory';
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

    const useCase = new CreateThesaurusUseCase({
      transactionManager,
      thesauriDS,
      thesaurusTranslationService,
    });

    return useCase;
  }
}

export { CreateThesaurusUseCaseFactory };
