import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';

export class GetTranslationsService {
  private translationsDS: TranslationsDataSource;

  constructor(translationsDS: TranslationsDataSource) {
    this.translationsDS = translationsDS;
  }

  getByLanguage(language: string) {
    return this.translationsDS.getByLanguage(language);
  }

  getByContext(context: string) {
    return this.translationsDS.getByContext(context);
  }

  getAll() {
    return this.translationsDS.getAll();
  }
}
