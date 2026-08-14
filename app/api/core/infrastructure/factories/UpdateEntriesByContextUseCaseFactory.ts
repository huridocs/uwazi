import { UpdateEntriesByContextUseCase } from '#api/core/application/UpdateEntriesByContext.js';
import { PropagateThesaurusTranslationServiceFactory } from './PropagateThesaurusTranslationServiceFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class UpdateEntriesByContextUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();

    return new UpdateEntriesByContextUseCase({
      transactionManager,
      settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
      translationsDS: TranslationsDataSourceFactory.default({ transactionManager }),
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
      propagateThesaurusTranslation: PropagateThesaurusTranslationServiceFactory.default(),
    });
  }
}
