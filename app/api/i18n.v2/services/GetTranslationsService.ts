import { TranslationsDataSource } from '../contracts/TranslationsDataSource';

export class GetTranslationsService {
  private translationsDS: TranslationsDataSource;

  constructor(translationsDS: TranslationsDataSource) {
    this.translationsDS = translationsDS;
  }

  getByLanguage(language: string) {
    return this.translationsDS.getByLanguage(language);
  }

  getAll() {
    return this.translationsDS.getAll();
  }
}
