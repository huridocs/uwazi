import { AddLanguageToPagesUseCase } from '#api/pages.v2/application/useCases/AddLanguageToPages.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PagesDataSourceFactory } from './PagesDataSourceFactory.js';

export class AddLanguageToPagesUseCaseFactory {
  static default() {
    const { actor } = ExecutionContext;
    const tenant = ExecutionContext.currentTenant;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new AddLanguageToPagesUseCase(
      {
        transactionManager,
        pagesDS: PagesDataSourceFactory.default(),
        settingsDS: SettingsDataSourceFactory.default(),
      },
      { actor, tenant }
    );
  }
}
