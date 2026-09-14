import { DeleteThesaurusUseCase } from '#api/core/application/DeleteThesaurus.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';

class DeleteThesaurusUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof DeleteThesaurusUseCase>[0]>) {
    const { transactionManager } = ExecutionContext;
    const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
    const templatesDS = TemplatesDataSourceFactory.default({ transactionManager });

    return new DeleteThesaurusUseCase(
      {
        transactionManager,
        thesauriDS,
        translationsDS,
        templatesDS,
        ...overrides,
      },
      { tenant: ExecutionContext.tenant, actor: ExecutionContext.actor }
    );
  }
}

export { DeleteThesaurusUseCaseFactory };
