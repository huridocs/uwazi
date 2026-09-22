import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { UpdateThesaurusUseCase } from '#api/core/application/UpdateThesaurus.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { DispatcherFactory } from '#api/core/infrastructure/factories/DispatcherFactory.js';

class UpdateThesaurusUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof UpdateThesaurusUseCase>[0]>) {
    const { transactionManager } = ExecutionContext;
    const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });

    const settingsDS = SettingsDataSourceFactory.default();
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });

    const thesaurusTranslationService = new ThesaurusTranslationService({
      settingsDS,
      translationsDS,
    });

    const dispatcher = DispatcherFactory.default();

    const thesauriService = new ThesauriService({
      dispatcher,
      thesauriDS,
      thesaurusTranslationService,
    });

    return new UpdateThesaurusUseCase(
      {
        transactionManager,
        thesauriDS,
        thesauriService,
        ...overrides,
      },
      { tenant: ExecutionContext.tenant, actor: ExecutionContext.actor }
    );
  }
}

export { UpdateThesaurusUseCaseFactory };
