import { CreateTranslationEntriesUseCase } from '#api/core/application/CreateTranslationEntries.js';
import { UpdateTranslationEntriesUseCase } from '#api/core/application/UpdateTranslationEntries.js';
import { ValidateTranslationsService } from '#api/core/application/translation/ValidateTranslationsService.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { PropagateThesaurusTranslationServiceFactory } from './PropagateThesaurusTranslationServiceFactory.js';
import { TranslationsQueryServiceFactory } from './TranslationsQueryServiceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

/**
 * Shared wiring for translation mutation orchestrators: one TM across DS + create/update UCs
 * so grouped `transactionManager.run()` calls stay atomic.
 */
export function createTranslationMutationDeps(transactionManager?: TransactionManager) {
  const tm = transactionManager ?? TransactionManagerFactory.default();
  const translationsDS = TranslationsDataSourceFactory.default({ transactionManager: tm });
  const settingsDS = SettingsDataSourceFactory.default({ transactionManager: tm });
  const validateTranslations = new ValidateTranslationsService(translationsDS, settingsDS);

  return {
    transactionManager: tm,
    translationsDS,
    settingsDS,
    query: TranslationsQueryServiceFactory.default(),
    createTranslationEntries: new CreateTranslationEntriesUseCase({
      transactionManager: tm,
      translationsDS,
      validateTranslations,
    }),
    updateTranslationEntries: new UpdateTranslationEntriesUseCase({
      transactionManager: tm,
      translationsDS,
      validateTranslations,
    }),
    propagateThesaurusTranslation: PropagateThesaurusTranslationServiceFactory.default(),
  };
}
