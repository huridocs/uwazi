import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { Translation } from '../model/Translation';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';

export interface CreateTranslationsData {
  language: string; // should be an enum ?
  key: string;
  value: string;
  context: {
    type?: 'Entity' | 'Relationship Type' | 'Uwazi UI' | 'Thesaurus';
    label: string;
    id: string;
  };
}

export class CreateTranslationsService {
  private translationsDS: TranslationsDataSource;

  private transactionManager: TransactionManager;

  constructor(translationsDS: TranslationsDataSource, transactionManager: TransactionManager) {
    this.translationsDS = translationsDS;
    this.transactionManager = transactionManager;
  }

  async create(translations: CreateTranslationsData[]) {
    return this.transactionManager.run(async () =>
      this.translationsDS.insert(
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
