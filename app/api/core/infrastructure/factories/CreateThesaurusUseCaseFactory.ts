import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { CreateThesaurusUseCase } from '#api/core/application/CreateThesaurus.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoThesauriDataSourceV2 } from '#api/core/infrastructure/mongodb/thesauri/MongoThesaurusDataSourceV2.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';

class CreateThesaurusUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const thesauriDS = new MongoThesauriDataSourceV2(getConnection(), transactionManager);

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
