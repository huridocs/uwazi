import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { Translation } from '../model/Translation';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';
import { CreateTranslationsData } from './CreateTranslationsService';

export class UpsertTranslationsService {
  private translationsDS: TranslationsDataSource;

  private transactionManager: TransactionManager;

  constructor(translationsDS: TranslationsDataSource, transactionManager: TransactionManager) {
    this.translationsDS = translationsDS;
    this.transactionManager = transactionManager;
  }

  async upsert(translations: CreateTranslationsData[]) {
    return this.transactionManager.run(async () =>
      this.translationsDS.upsert(
        translations.map(
          translation =>
            new Translation(
              translation.key,
              translation.value,
              translation.language,
              translation.context
            )
        )
      )
    );
  }
}
