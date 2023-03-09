import { TranslationsDataSource } from '../contracts/TranslationsDataSource';

export class GetTranslationsService {
  private translationsDS: TranslationsDataSource;

  constructor(translationsDS: TranslationsDataSource) {
    this.translationsDS = translationsDS;
  }

  getAll() {
    return this.translationsDS.getAll();
  }
}
