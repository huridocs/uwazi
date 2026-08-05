import { AddLanguageToPagesUseCase } from '#api/pages.v2/application/useCases/AddLanguageToPages.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { PagesDataSourceFactory } from './PagesDataSourceFactory.js';
import { pageUseCaseExecutionContext } from './pageUseCaseExecutionContext.js';

export class AddLanguageToPagesUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const { actor, tenant } = pageUseCaseExecutionContext();

    return new AddLanguageToPagesUseCase(
      {
        transactionManager,
        pagesDS: PagesDataSourceFactory.default({ transactionManager }),
        settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
      },
      { actor, tenant }
    );
  }
}
