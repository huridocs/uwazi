import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { UpdateThesaurusUseCase } from '#api/core/application/UpdateThesaurus.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';

class UpdateThesaurusUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof UpdateThesaurusUseCase>[0]>) {
    const transactionManager = TransactionManagerFactory.default();
    const thesauriDS = ThesauriDataSourceFactory.default(transactionManager);

    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);

    const thesaurusTranslationService = new ThesaurusTranslationService({
      settingsDS,
      translationsDS,
    });

    const jobsDispatcher = ExecutionContext.jobsDispatcher;

    const thesauriService = new ThesauriService({
      jobsDispatcher,
      thesauriDS,
      thesaurusTranslationService,
    });

    return new UpdateThesaurusUseCase(
      {
        transactionManager,
        thesauriDS,
        thesaurusTranslationService,
        jobsDispatcher,
        thesauriService,
        ...overrides,
      },
      { tenant: ExecutionContext.tenant, actor: ExecutionContext.actor }
    );
  }
}

export { UpdateThesaurusUseCaseFactory };
