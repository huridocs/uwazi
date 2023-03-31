import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';

export class DeleteTranslationsService {
  private translationsDS: TranslationsDataSource;

  private transactionManager: TransactionManager;

  constructor(translationsDS: TranslationsDataSource, transactionManager: TransactionManager) {
    this.translationsDS = translationsDS;
    this.transactionManager = transactionManager;
  }

  async deleteByContextId(contextId: string) {
    return this.transactionManager.run(async () =>
      this.translationsDS.deleteByContextId(contextId)
    );
  }

  async deleteByLanguage(language: string) {
    return this.transactionManager.run(async () => this.translationsDS.deleteByLanguage(language));
  }
}
