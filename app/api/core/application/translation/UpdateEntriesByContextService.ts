import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { TranslationsQueryService } from '#api/core/application/translation/TranslationsQueryService.js';
import { SaveLocaleTranslationsService } from '#api/core/application/translation/SaveLocaleTranslationsService.js';
import { PropagateThesaurusTranslationService } from '#api/core/application/translation/PropagateThesaurusTranslationService.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TranslationType } from '#shared/translationType.js';

type KeyValuePairsPerLanguage = {
  [language: string]: { [key: string]: string };
};

type Deps = {
  transactionManager: TransactionManager;
  settingsDS: SettingsDataSource;
  query: TranslationsQueryService;
  saveLocaleTranslations: SaveLocaleTranslationsService;
  propagateThesaurusTranslation: PropagateThesaurusTranslationService;
};

type PreparedLocaleUpdate = {
  previousContexts: NonNullable<TranslationType['contexts']>;
  next: TranslationType;
};

function checkForMissingKeys(
  keyValuePairsPerLanguage: KeyValuePairsPerLanguage,
  locale: string,
  valueDict: Record<string, string>,
  contextId: string
) {
  const missingKeys = Object.keys(keyValuePairsPerLanguage[locale]).filter(
    key => !(key in valueDict)
  );
  if (missingKeys.length) {
    throw new Error(
      `Process is trying to update missing translation keys: ${locale} - ${contextId} - ${missingKeys}.`
    );
  }
}

class UpdateEntriesByContextService {
  constructor(private deps: Deps) {}

  private async prepareUpdates(
    contextId: string,
    keyValuePairsPerLanguage: KeyValuePairsPerLanguage
  ): Promise<PreparedLocaleUpdate[]> {
    const languageKeys = await this.deps.settingsDS.getLanguageKeys();
    const languagesSet = new Set(languageKeys.map(String));

    const languagesToUpdate = Object.keys(keyValuePairsPerLanguage).filter(l =>
      languagesSet.has(l)
    ) as LanguageISO6391[];

    const prepared: PreparedLocaleUpdate[] = [];

    // eslint-disable-next-line max-statements
    const prepareOne = async (language: LanguageISO6391) => {
      const [translation] = await this.deps.query.getLegacy({ locale: language });
      if (!translation?.locale) {
        throw new Error('Translation local does not exist !');
      }

      const context = (translation.contexts || []).find(c => c.id === contextId);
      if (!context) {
        return;
      }

      // Snapshot before mutating context.values for persist/propagate diffs
      const previousContexts = (translation.contexts || []).map(c => ({
        ...c,
        values: [...(c.values || [])],
      }));
      const valueDict: Record<string, string> = Object.fromEntries(
        (context.values || []).map(({ key, value }) => [key!, value!])
      );
      checkForMissingKeys(keyValuePairsPerLanguage, translation.locale, valueDict, contextId);
      Object.entries(keyValuePairsPerLanguage[translation.locale]).forEach(([key, value]) => {
        valueDict[key] = value;
      });
      context.values = Object.entries(valueDict).map(([key, value]) => ({ key, value }));

      prepared.push({
        previousContexts,
        next: this.deps.saveLocaleTranslations.prepare(translation),
      });
    };

    await Promise.all(languagesToUpdate.map(async language => prepareOne(language)));

    return prepared;
  }

  async execute(
    contextId: string,
    keyValuePairsPerLanguage: KeyValuePairsPerLanguage
  ): Promise<(TranslationType | void)[]> {
    const prepared = await this.prepareUpdates(contextId, keyValuePairsPerLanguage);

    await this.deps.transactionManager.run(async () => {
      await prepared.reduce(async (previous, { next }) => {
        await previous;
        await this.deps.saveLocaleTranslations.persist(next);
      }, Promise.resolve());
    });

    await Promise.all(
      prepared.map(async ({ next, previousContexts }) =>
        this.deps.propagateThesaurusTranslation.forLocale(next, previousContexts)
      )
    );

    return prepared.map(({ next }) => next);
  }
}

export { UpdateEntriesByContextService };
export type { KeyValuePairsPerLanguage };
