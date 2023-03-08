import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { Translation } from '../model/Translation';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';

interface CreateTranslationsData {
  language: string; // should be an enum ?
  key: string;
  value: string;
  context: { type: string; label: string; id: string };
}

export class CreateTranslations {
  private translationsDS: TranslationsDataSource;

  private transactionManager: TransactionManager;

  private idGenerator: IdGenerator;

  constructor(
    translationsDS: TranslationsDataSource,
    transactionManager: TransactionManager,
    idGenerator: IdGenerator
  ) {
    this.translationsDS = translationsDS;
    this.transactionManager = transactionManager;
    this.idGenerator = idGenerator;
  }

  async create(translations: CreateTranslationsData[]) {
    await this.transactionManager.run(async () =>
      this.translationsDS.insert(
        translations.map(
          translation =>
            new Translation(
              this.idGenerator.generate(),
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
