import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { UpdateThesaurusUseCase } from '#api/core/application/UpdateThesaurus.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { DispatcherAdapter } from '#api/core/infrastructure/jobs/DispatcherAdapter.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
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

    const dispatcher = new DispatcherAdapter(ExecutionContext.jobsDispatcher);

    const thesauriService = new ThesauriService({
      dispatcher,
      thesauriDS,
      thesaurusTranslationService,
    });

    return new UpdateThesaurusUseCase(
      {
        transactionManager,
        thesauriDS,
        thesaurusTranslationService,
        thesauriService,
        ...overrides,
      },
      { tenant: ExecutionContext.tenant, actor: ExecutionContext.actor }
    );
  }
}

export { UpdateThesaurusUseCaseFactory };
