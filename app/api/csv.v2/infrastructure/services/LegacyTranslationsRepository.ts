import translations from 'api/i18n/translations';
import { TranslationsRepository } from '../../application/contracts/TranslationsRepository';

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
