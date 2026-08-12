import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TranslationsServiceFactory } from '#api/core/infrastructure/factories/TranslationsServiceFactory.js';
import { DispatcherAdapter } from '#api/core/infrastructure/jobs/DispatcherAdapter.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';

class ThesauriServiceFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    const translationsService = TranslationsServiceFactory.default({ transactionManager });
    const thesaurusTranslationService = new ThesaurusTranslationService({
      settingsDS,
      translationsService,
    });
    return new ThesauriService({
      dispatcher: new DispatcherAdapter(ExecutionContext.jobsDispatcher),
      thesauriDS,
      thesaurusTranslationService,
    });
  }
}

export { ThesauriServiceFactory };
