import { CreateThesaurusUseCase } from '#api/core/application/CreateThesaurus.js';
import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { DispatcherFactory } from '#api/core/infrastructure/factories/DispatcherFactory.js';

class CreateThesaurusUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof CreateThesaurusUseCase>[0]>) {
    const { transactionManager } = ExecutionContext;
    const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });

    const settingsDS = SettingsDataSourceFactory.default();
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });

    const thesaurusTranslationService = new ThesaurusTranslationService({
      settingsDS,
      translationsDS,
    });

    const thesauriService = new ThesauriService({
      thesauriDS,
      thesaurusTranslationService,
      dispatcher: DispatcherFactory.default(),
    });

    return new CreateThesaurusUseCase(
      {
        transactionManager,
        thesauriService,
        ...overrides,
      },
      { tenant: ExecutionContext.tenant, actor: ExecutionContext.actor }
    );
  }
}

export { CreateThesaurusUseCaseFactory };
