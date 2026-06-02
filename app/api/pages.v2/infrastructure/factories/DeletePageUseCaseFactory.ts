import { DeletePageUseCase } from '#api/pages.v2/application/useCases/DeletePage.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { PagesDataSourceFactory } from './PagesDataSourceFactory.js';
import { PageReleasesDataSourceFactory } from './PageReleasesDataSourceFactory.js';
import { pageUseCaseExecutionContext } from './pageUseCaseExecutionContext.js';

export class DeletePageUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const { actor, tenant } = pageUseCaseExecutionContext();

    return new DeletePageUseCase(
      {
        transactionManager,
        pagesDS: PagesDataSourceFactory.default({ transactionManager }),
        pageReleasesDS: PageReleasesDataSourceFactory.default({ transactionManager }),
      },
      { actor, tenant }
    );
  }
}
