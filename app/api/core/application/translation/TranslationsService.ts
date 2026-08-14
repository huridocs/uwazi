import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { TranslationsDataSource } from '#api/core/application/contracts/TranslationsDataSource.js';
import {
  TranslationEntryInput,
  ValidateTranslationsService,
} from '#api/core/application/translation/ValidateTranslationsService.js';
import { Translation, TranslationContext } from '#api/core/domain/translation/Translation.js';

type Deps = {
  transactionManager: TransactionManager;
  translationsDS: TranslationsDataSource;
  settingsDS: SettingsDataSource;
  validateTranslations: ValidateTranslationsService;
};

function toDomainModels(translations: TranslationEntryInput[]): Translation[] {
  return translations.map(
    translation =>
      new Translation(translation.key, translation.value, translation.language, translation.context)
  );
}

/**
 * Multi-step translation writes (EntitiesService-style).
 * Single DS operations belong on TranslationsDataSource, inside the parent TM.run().
 */
class TranslationsService {
  constructor(private deps: Deps) {}

  private ensureTransaction() {
    if (!this.deps.transactionManager.isRunning()) {
      throw new Error('This operation must be called within a transaction');
    }
  }

  private async partitionByExistence(translations: TranslationEntryInput[]) {
    const byContext = new Map<string, TranslationEntryInput[]>();
    translations.forEach(t => {
      const list = byContext.get(t.context.id) || [];
      list.push(t);
      byContext.set(t.context.id, list);
    });

    const toCreate: TranslationEntryInput[] = [];
    const toUpdate: TranslationEntryInput[] = [];

    await Promise.all(
      [...byContext.entries()].map(async ([contextId, entries]) => {
        const keys = Array.from(new Set(entries.map(e => e.key)));
        const missingKeys = new Set(
          await this.deps.translationsDS.calculateNonexistentKeys(contextId, keys)
        );
        entries.forEach(entry => {
          if (missingKeys.has(entry.key)) {
            toCreate.push(entry);
          } else {
            toUpdate.push(entry);
          }
        });
      })
    );

    return { toCreate, toUpdate };
  }

  async insertEntries(translations: TranslationEntryInput[]): Promise<Translation[]> {
    this.ensureTransaction();
    await this.deps.validateTranslations.languagesExist(translations);
    await this.deps.validateTranslations.translationsWillExistsInAllLanguages(translations);
    return this.deps.translationsDS.insert(toDomainModels(translations));
  }

  async upsertEntries(translations: TranslationEntryInput[]): Promise<Translation[]> {
    this.ensureTransaction();
    await this.deps.validateTranslations.languagesExist(translations);

    const byContext = new Map<string, Set<string>>();
    translations.forEach(t => {
      const keys = byContext.get(t.context.id) || new Set<string>();
      keys.add(t.key);
      byContext.set(t.context.id, keys);
    });

    await Promise.all(
      [...byContext.entries()].map(async ([contextId, keys]) => {
        const missing = await this.deps.translationsDS.calculateNonexistentKeys(
          contextId,
          Array.from(keys)
        );
        if (missing.length) {
          throw new Error(
            `Process is trying to update missing translation keys: ${contextId} - ${missing}.`
          );
        }
      })
    );

    return this.deps.translationsDS.upsert(toDomainModels(translations));
  }

  async saveEntries(translations: TranslationEntryInput[]): Promise<void> {
    this.ensureTransaction();
    if (!translations.length) {
      return;
    }

    const { toCreate, toUpdate } = await this.partitionByExistence(translations);

    if (toCreate.length) {
      await this.insertEntries(toCreate);
    }
    if (toUpdate.length) {
      await this.upsertEntries(toUpdate);
    }
  }

  async createContext(context: TranslationContext, values: Record<string, string>): Promise<void> {
    const languages = await this.deps.settingsDS.getLanguageKeys();
    const entries: Translation[] = [];

    languages.forEach(language => {
      Object.entries(values).forEach(([key, value]) => {
        entries.push(new Translation(key, value, language, context));
      });
    });

    this.ensureTransaction();
    await this.deps.translationsDS.insert(entries);
  }

  async updateContext(input: {
    context: TranslationContext;
    keyChanges: Record<string, string>;
    keysToDelete: string[];
    valueChanges: Record<string, string>;
  }): Promise<void> {
    const languages = await this.deps.settingsDS.getLanguageKeys();
    const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();

    this.ensureTransaction();
    const translationContext = await this.deps.translationsDS.getContext(
      input.context,
      languages,
      defaultLanguage
    );
    translationContext.applyChanges(input.keyChanges, input.valueChanges, input.keysToDelete);
    await this.deps.translationsDS.updateContext(translationContext);
  }
}

export { TranslationsService };
