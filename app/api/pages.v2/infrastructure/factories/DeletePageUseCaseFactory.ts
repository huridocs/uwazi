import { DeletePageUseCase } from '#api/pages.v2/application/useCases/DeletePage.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PagesDataSourceFactory } from './PagesDataSourceFactory.js';
import { PageReleasesDataSourceFactory } from './PageReleasesDataSourceFactory.js';
import { TemplatesPageUsageDataSourceFactory } from './TemplatesPageUsageDataSourceFactory.js';

export class DeletePageUseCaseFactory {
  static default() {
    const { actor } = ExecutionContext;
    const tenant = ExecutionContext.currentTenant;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new DeletePageUseCase(
      {
        transactionManager,
        pagesDS: PagesDataSourceFactory.default(),
        pageReleasesDS: PageReleasesDataSourceFactory.default(),
        templatesDS: TemplatesPageUsageDataSourceFactory.default(),
      },
      { actor, tenant }
    );
  }
}
