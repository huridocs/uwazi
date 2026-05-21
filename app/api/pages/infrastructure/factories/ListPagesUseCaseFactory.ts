import { ListPagesUseCase } from '#api/pages/application/ListPages.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { PagesDataSourceFactory } from './PagesDataSourceFactory.js';
import { PageReleasesDataSourceFactory } from './PageReleasesDataSourceFactory.js';
import { pageUseCaseExecutionContext } from './pageUseCaseExecutionContext.js';

export class ListPagesUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const { actor, tenant } = pageUseCaseExecutionContext();

    return new ListPagesUseCase(
      {
        transactionManager,
        pagesDS: PagesDataSourceFactory.default({ transactionManager }),
        pageReleasesDS: PageReleasesDataSourceFactory.default({ transactionManager }),
      },
      { actor, tenant }
    );
  }
}
