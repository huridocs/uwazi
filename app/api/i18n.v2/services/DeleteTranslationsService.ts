// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/Transac... Remove this comment to see the full error message
import { TransactionManager } from '../common.v2/contracts/TransactionManager.js';
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
