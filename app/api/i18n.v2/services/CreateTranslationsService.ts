import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';
import { Translation } from '../model/Translation';
import { ValidateTranslationsService } from './ValidateTranslationsService';

export interface CreateTranslationsData {
  language: LanguageISO6391;
  key: string;
  value: string;
  context: {
    type: 'Entity' | 'Relationship Type' | 'Uwazi UI' | 'Thesaurus';
    label: string;
    id: string;
  };
}

export class CreateTranslationsService {
  private translationsDS: TranslationsDataSource;

  private validationService: ValidateTranslationsService;

  private transactionManager: TransactionManager;

  constructor(
    translationsDS: TranslationsDataSource,
    validationService: ValidateTranslationsService,
    transactionManager: TransactionManager
  ) {
    this.translationsDS = translationsDS;
    this.validationService = validationService;
    this.transactionManager = transactionManager;
  }

  async create(translations: CreateTranslationsData[]) {
    await this.validationService.languagesExist(translations);

    await this.validationService.translationsWillExistsInAllLanguages(translations);

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
