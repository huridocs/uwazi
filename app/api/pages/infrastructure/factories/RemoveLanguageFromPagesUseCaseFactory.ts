import { RemoveLanguageFromPagesUseCase } from '#api/pages/application/RemoveLanguageFromPages.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { PagesDataSourceFactory } from './PagesDataSourceFactory.js';
import { pageUseCaseExecutionContext } from './pageUseCaseExecutionContext.js';

export class RemoveLanguageFromPagesUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const { actor, tenant } = pageUseCaseExecutionContext();

    return new RemoveLanguageFromPagesUseCase(
      {
        transactionManager,
        pagesDS: PagesDataSourceFactory.default({ transactionManager }),
      },
      { actor, tenant }
    );
  }
}
