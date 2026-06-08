import { DeleteThesaurusUseCase } from '#api/core/application/DeleteThesaurus.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';

class DeleteThesaurusUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof DeleteThesaurusUseCase>[0]>) {
    const transactionManager = TransactionManagerFactory.default();
    const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
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
