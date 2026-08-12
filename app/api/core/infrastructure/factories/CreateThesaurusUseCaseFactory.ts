import { CreateThesaurusUseCase } from '#api/core/application/CreateThesaurus.js';
import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TranslationsServiceFactory } from '#api/core/infrastructure/factories/TranslationsServiceFactory.js';
import { DispatcherAdapter } from '#api/core/infrastructure/jobs/DispatcherAdapter.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';

class CreateThesaurusUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof CreateThesaurusUseCase>[0]>) {
    const transactionManager = TransactionManagerFactory.default();
    const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });

    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    const translationsService = TranslationsServiceFactory.default({ transactionManager });

    const thesaurusTranslationService = new ThesaurusTranslationService({
      settingsDS,
      translationsService,
    });

    const thesauriService = new ThesauriService({
      thesauriDS,
      thesaurusTranslationService,
      dispatcher: new DispatcherAdapter(ExecutionContext.jobsDispatcher),
    });

    return new CreateThesaurusUseCase({
      transactionManager,
      thesauriService,
      ...overrides,
    });
  }
}

export { CreateThesaurusUseCaseFactory };
