import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { CreateThesaurusUseCase } from '#api/core/application/CreateThesaurus.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';

class CreateThesaurusUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof CreateThesaurusUseCase>[0]>) {
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
      jobsDispatcher: ExecutionContext.jobsDispatcher,
    });

    return new CreateThesaurusUseCase({
      transactionManager,
      thesauriService,
      ...overrides,
    });
  }
}

export { CreateThesaurusUseCaseFactory };
