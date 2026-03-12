import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { Translation } from '#api/i18n.v2/model/Translation.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TranslationsRepository } from '../../application/contracts/TranslationsRepository.js';

export class CsvTranslationsRepository implements TranslationsRepository {
  private translationsDS: TranslationsDataSource;

  constructor(transactionManager: MongoTransactionManager) {
    this.translationsDS = DefaultTranslationsDataSource(transactionManager);
  }

  private async resolveContextLabel(contextId: string, contextLabel?: string) {
    if (contextLabel) {
      return contextLabel;
    }

    const existing = await this.translationsDS.getByContext(contextId).all();
    return existing[0]?.context.label || contextId;
  }

  async updateEntries(
    contextId: string,
    keyValuePairsPerLanguage: Record<string, Record<string, string>>,
    contextLabel?: string
  ): Promise<void> {
    if (!Object.keys(keyValuePairsPerLanguage).length) {
      return;
    }

    const resolvedContextLabel = await this.resolveContextLabel(contextId, contextLabel);
    const translations: Translation[] = [];

    Object.entries(keyValuePairsPerLanguage).forEach(([language, keyValuePairs]) => {
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        translations.push(
          new Translation(key, value, language as LanguageISO6391, {
            id: contextId,
            label: resolvedContextLabel,
            type: 'Thesaurus',
          })
        );
      });
    });

    if (!translations.length) {
      return;
    }

    await this.translationsDS.upsert(translations);
  }
}
