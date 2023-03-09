import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { Translation } from '../model/Translation';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';

interface UpdateTranslationsData {
  _id: string;
  language: string; // should be an enum ?
  key: string;
  value: string;
  context: { type: string; label: string; id: string };
}

export class UpdateTranslationsService {
  private translationsDS: TranslationsDataSource;

  private transactionManager: TransactionManager;

  constructor(translationsDS: TranslationsDataSource, transactionManager: TransactionManager) {
    this.translationsDS = translationsDS;
    this.transactionManager = transactionManager;
  }

  async update(translations: UpdateTranslationsData[]) {
    return this.transactionManager.run(async () =>
      this.translationsDS.update(
        translations.map(
          translation =>
            new Translation(
              translation._id,
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
