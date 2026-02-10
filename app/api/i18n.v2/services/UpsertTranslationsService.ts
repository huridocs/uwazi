import { TransactionManager } from 'api/core/application/contracts/TransactionManager';
import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';
import { Translation } from '../model/Translation';
import { CreateTranslationsData } from './CreateTranslationsService';
import { ValidateTranslationsService } from './ValidateTranslationsService';

export class UpsertTranslationsService {
  private translationsDS: TranslationsDataSource;

  private settingsDS: SettingsDataSource;

  private validationService: ValidateTranslationsService;

  private transactionManager: TransactionManager;

  constructor(
    translationsDS: TranslationsDataSource,
    settingsDS: SettingsDataSource,
    validationService: ValidateTranslationsService,
    transactionManager: TransactionManager
  ) {
    this.translationsDS = translationsDS;
    this.settingsDS = settingsDS;
    this.validationService = validationService;
    this.transactionManager = transactionManager;
  }

  async upsert(translations: CreateTranslationsData[]) {
    await this.validationService.languagesExist(translations);
    await this.validationService.translationsWillExistsInAllLanguages(translations);

    return this.transactionManager.run(async () =>
      this.translationsDS.upsert(
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

  /**
   * Updates translation keys for a context, handling renames, value updates, and deletions.
   *
   * @param context - The translation context (template, thesaurus, etc.)
   * @param keyChanges - Keys to rename: { oldKey: newKey }. Old keys are automatically deleted after rename.
   * @param valueChanges - Current values for all keys in the context (the source of truth for what should exist)
   * @param keysToDelete - Keys to explicitly delete (for properties removed from context).
   *                       Note: You don't need to include renamed keys here - they're
   *                       automatically deleted based on keyChanges.
   *
   * @example
   * // Rename property and delete another
   * await updateContext(
   *   context,
   *   { 'Old Name': 'New Name' },     // Old Name will be automatically deleted after rename
   *   { 'New Name': 'New Name', 'Other': 'Other' },
   *   ['Deleted Property']             // Only explicitly deleted properties
   * );
   *
   * @remarks
   * - Keys that exist in valueChanges (the final context) are ALWAYS protected from deletion
   * - Context protection applies to both automatic deletions (from renames) and explicit deletions
   * - This allows shared keys (e.g., template name and property with same label) to coexist
   * - If a key appears in keysToDelete but also in valueChanges, it will NOT be deleted (context wins)
   * - If renaming creates a duplicate key, the rename is skipped
   * - Keys renamed to themselves (no-op) are allowed
   * - The keysToDelete parameter can include renamed keys for backward compatibility (duplicates are handled)
   * - Deduplication only affects keys within the same context
   */
  async updateContext(
    context: CreateTranslationsData['context'],
    keyChanges: { [oldKey: string]: string },
    valueChanges: { [key: string]: string },
    keysToDelete: string[]
  ) {
    return this.transactionManager.run(async () => {
      const existingKeys = await this.getExistingKeysInContext(context.id);

      const deduplicatedKeyChanges = this.deduplicateKeyChanges(
        keyChanges,
        existingKeys,
        valueChanges
      );

      const keysToRemove = this.calculateKeysToRemove(
        keyChanges,
        deduplicatedKeyChanges,
        keysToDelete,
        valueChanges
      );

      const keysChangedReversed = Object.entries(deduplicatedKeyChanges).reduce<{
        [newKey: string]: string;
      }>((keys, [oldKey, newKey]) => {
        // eslint-disable-next-line no-param-reassign
        keys[newKey] = oldKey;
        return keys;
      }, {});

      await this.createNewKeys(keysChangedReversed, valueChanges, context);

      await this.translationsDS.updateContextLabel(context.id, context.label);

      await this.translationsDS.updateKeysByContext(context.id, deduplicatedKeyChanges);

      await this.updateKeyValueOnDefaultLanguage(Object.values(deduplicatedKeyChanges), context);

      await this.translationsDS.deleteKeysByContext(context.id, keysToRemove);
    });
  }

  private async updateKeyValueOnDefaultLanguage(
    newKeys: string[],
    context: CreateTranslationsData['context']
  ) {
    const defaultLanguageKey = await this.settingsDS.getDefaultLanguageKey();

    await this.translationsDS.upsert(
      newKeys.reduce<Translation[]>((memo, newKey) => {
        memo.push(new Translation(newKey, newKey, defaultLanguageKey, context));
        return memo;
      }, [])
    );
  }

  private async createNewKeys(
    keysChangedReversed: { [x: string]: string },
    valueChanges: { [key: string]: string },
    context: CreateTranslationsData['context']
  ) {
    const originalKeysGoingToChange = Object.keys(valueChanges).reduce<string[]>((keys, key) => {
      if (keysChangedReversed[key]) {
        keys.push(keysChangedReversed[key]);
      } else {
        keys.push(key);
      }
      return keys;
    }, []);

    const missingKeysInDB = await this.translationsDS.calculateNonexistentKeys(
      context.id,
      originalKeysGoingToChange
    );

    if (missingKeysInDB.length) {
      const keysChangedForward = Object.entries(keysChangedReversed).reduce<{
        [oldKey: string]: string;
      }>((keys, [newKey, oldKey]) => {
        // eslint-disable-next-line no-param-reassign
        keys[oldKey] = newKey;
        return keys;
      }, {});

      await this.translationsDS.insert(
        (await this.settingsDS.getLanguageKeys()).reduce<Translation[]>(
          (memo, languageKey) =>
            memo.concat(
              missingKeysInDB.map(key => {
                const newKey = keysChangedForward[key];
                const value = newKey ? valueChanges[newKey] : valueChanges[key];
                return new Translation(key, value, languageKey, context);
              })
            ),
          []
        )
      );
    }
  }

  /**
   * Gets all existing translation keys within a specific context.
   * Deduplication only affects keys within the same context.
   * Different contexts can have the same keys without conflict.
   */
  private async getExistingKeysInContext(contextId: string): Promise<Set<string>> {
    const translations = await this.translationsDS.getByContext(contextId).all();
    return new Set(translations.map(t => t.key));
  }

  private deduplicateKeyChanges(
    keyChanges: { [oldKey: string]: string },
    existingKeys: Set<string>,
    valueChanges: { [key: string]: string }
  ): { [oldKey: string]: string } {
    const deduplicated: { [oldKey: string]: string } = {};

    Object.entries(keyChanges).forEach(([oldKey, newKey]) => {
      const targetExists = existingKeys.has(newKey);
      const isNoOp = oldKey === newKey;
      const oldKeyStillNeeded = !!valueChanges[oldKey];

      if ((!targetExists || isNoOp) && !oldKeyStillNeeded) {
        deduplicated[oldKey] = newKey;
      }
    });

    return deduplicated;
  }

  private calculateKeysToRemove(
    originalKeyChanges: { [oldKey: string]: string },
    deduplicatedKeyChanges: { [oldKey: string]: string },
    keysToDelete: string[],
    valueChanges: { [key: string]: string }
  ): string[] {
    const keysToRemoveSet = new Set<string>();

    keysToDelete.forEach(key => keysToRemoveSet.add(key));

    Object.entries(originalKeyChanges).forEach(([oldKey, newKey]) => {
      if (oldKey !== newKey) {
        keysToRemoveSet.add(oldKey);
      }
    });

    return Array.from(keysToRemoveSet).filter(key => !valueChanges[key]);
  }
}
