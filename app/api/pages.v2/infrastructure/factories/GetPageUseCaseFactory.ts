import { GetPageUseCase } from '#api/pages.v2/application/useCases/GetPage.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PagesDataSourceFactory } from './PagesDataSourceFactory.js';
import { PageReleasesDataSourceFactory } from './PageReleasesDataSourceFactory.js';

export class GetPageUseCaseFactory {
  static default() {
    const { actor } = ExecutionContext;
    const tenant = ExecutionContext.currentTenant;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new GetPageUseCase(
      {
        transactionManager,
        pagesDS: PagesDataSourceFactory.default(),
        pageReleasesDS: PageReleasesDataSourceFactory.default(),
        settingsDS: SettingsDataSourceFactory.default(),
      },
      { actor, tenant }
    );
  }
}
