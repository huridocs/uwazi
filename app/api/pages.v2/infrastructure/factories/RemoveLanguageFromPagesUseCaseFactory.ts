import { RemoveLanguageFromPagesUseCase } from '#api/pages.v2/application/useCases/RemoveLanguageFromPages.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PagesDataSourceFactory } from './PagesDataSourceFactory.js';

export class RemoveLanguageFromPagesUseCaseFactory {
  static default() {
    const { actor } = ExecutionContext;
    const tenant = ExecutionContext.currentTenant;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new RemoveLanguageFromPagesUseCase(
      {
        transactionManager,
        pagesDS: PagesDataSourceFactory.default(),
      },
      { actor, tenant }
    );
  }
}
