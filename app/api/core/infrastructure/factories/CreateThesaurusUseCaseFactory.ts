import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { CreateThesaurusUseCase } from 'api/core/application/CreateThesaurus';
import { ThesaurusTranslationService } from 'api/core/application/thesaurusTranslationService/ThesaurusTranslationService';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { MongoThesauriDataSourceV2 } from '../mongodb/thesauri/MongoThesaurusDataSourceV2';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory';

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
