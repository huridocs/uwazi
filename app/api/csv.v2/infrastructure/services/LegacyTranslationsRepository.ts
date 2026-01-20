import translations from '#api/i18n/translations.js';
import { TranslationsRepository } from '#api/csv.v2/application/contracts/TranslationsRepository.js';

export class LegacyTranslationsRepository implements TranslationsRepository {
  // eslint-disable-next-line class-methods-use-this
  async updateEntries(
    contextId: string,
    keyValuePairsPerLanguage: Record<string, Record<string, string>>
  ): Promise<void> {
    if (!Object.keys(keyValuePairsPerLanguage).length) {
      return;
    }
    await translations.updateEntries(contextId, keyValuePairsPerLanguage);
  }
}
