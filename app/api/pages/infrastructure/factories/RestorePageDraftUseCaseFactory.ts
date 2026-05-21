import { RestorePageDraftUseCase } from '#api/pages/application/RestorePageDraft.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { PagesDataSourceFactory } from './PagesDataSourceFactory.js';
import { PageReleasesDataSourceFactory } from './PageReleasesDataSourceFactory.js';
import { pageUseCaseExecutionContext } from './pageUseCaseExecutionContext.js';

export class RestorePageDraftUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const { actor, tenant } = pageUseCaseExecutionContext();

    return new RestorePageDraftUseCase(
      {
        transactionManager,
        pagesDS: PagesDataSourceFactory.default({ transactionManager }),
        pageReleasesDS: PageReleasesDataSourceFactory.default({ transactionManager }),
        settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
      },
      { actor, tenant }
    );
  }
}
