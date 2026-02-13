/* eslint-disable class-methods-use-this */
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Translation, TranslationContext } from './Translation';
import { TranslationContextDiff } from './TranslationContextDiff';

export class TranslationContextModel {
  private contextInfo: TranslationContext;

  private translations: Map<string, Map<LanguageISO6391, Translation>>;

  private languages: LanguageISO6391[];

  private defaultLanguage: LanguageISO6391;

  private originalTranslations: Map<string, Map<LanguageISO6391, Translation>>;

  private originalContextLabel: string;

  private constructor(
    contextInfo: TranslationContext,
    translations: Translation[],
    languages: LanguageISO6391[],
    defaultLanguage: LanguageISO6391
  ) {
    this.contextInfo = contextInfo;
    this.languages = languages;
    this.defaultLanguage = defaultLanguage;

    this.translations = this.buildTranslationIndex(translations);
    this.originalTranslations = this.cloneTranslationIndex(this.translations);
    // Extract original label from existing translations (for updates),
    // or use contextInfo label if no translations exist (for new contexts)
    this.originalContextLabel =
      translations.length > 0 ? translations[0].context.label : contextInfo.label;
  }

  /**
   * Factory method to create a TranslationContext from existing translations.
   * If no translations exist yet (e.g., new context), pass an empty array.
   */
  static create(
    contextInfo: TranslationContext,
    existingTranslations: Translation[],
    languages: LanguageISO6391[],
    defaultLanguage: LanguageISO6391
  ): TranslationContextModel {
    return new TranslationContextModel(
      contextInfo,
      existingTranslations,
      languages,
      defaultLanguage
    );
  }

  private buildTranslationIndex(
    translations: Translation[]
  ): Map<string, Map<LanguageISO6391, Translation>> {
    const index = new Map<string, Map<LanguageISO6391, Translation>>();

    translations.forEach(translation => {
      if (!index.has(translation.key)) {
        index.set(translation.key, new Map<LanguageISO6391, Translation>());
      }
      index.get(translation.key)!.set(translation.language, translation);
    });

    return index;
  }

  private cloneTranslationIndex(
    index: Map<string, Map<LanguageISO6391, Translation>>
  ): Map<string, Map<LanguageISO6391, Translation>> {
    const cloned = new Map<string, Map<LanguageISO6391, Translation>>();

    index.forEach((langMap, key) => {
      const clonedLangMap = new Map<LanguageISO6391, Translation>();
      langMap.forEach((translation, lang) => {
        clonedLangMap.set(lang, translation);
      });
      cloned.set(key, clonedLangMap);
    });

    return cloned;
  }

  /**
   * Applies changes to the translation context in-memory.
   *
   * @param keyChanges - Keys to rename: { oldKey: newKey }
   * @param valueChanges - Current values for all keys (source of truth)
   * @param keysToDelete - Keys to explicitly delete
   */
  applyChanges(
    keyChanges: { [oldKey: string]: string },
    valueChanges: { [key: string]: string },
    keysToDelete: string[]
  ): void {
    const { deduplicatedKeyChanges, keysWithMultipleToOneRename } = this.deduplicateKeyChanges(
      keyChanges,
      valueChanges
    );

    const keysToRemove = this.calculateKeysToRemove(keyChanges, keysToDelete, valueChanges);

    this.applyRenames(deduplicatedKeyChanges);

    this.updateDefaultLanguageForRenames(Object.values(deduplicatedKeyChanges));

    if (keysWithMultipleToOneRename.length > 0) {
      this.updateAllLanguagesForKeys(keysWithMultipleToOneRename);
    }

    this.createMissingKeys(valueChanges);

    this.deleteKeys(keysToRemove);
  }

  /**
   * Deduplicates rename operations to handle collisions.
   * Returns only the renames that can safely be executed.
   */
  private deduplicateKeyChanges(
    keyChanges: { [oldKey: string]: string },
    valueChanges: { [key: string]: string }
  ): {
    deduplicatedKeyChanges: { [oldKey: string]: string };
    keysWithMultipleToOneRename: string[];
  } {
    const deduplicated: { [oldKey: string]: string } = {};
    const keysCreatedDuringRename = new Set<string>();
    const multipleToOneKeys = new Set<string>();

    Object.entries(keyChanges).forEach(([oldKey, newKey]) => {
      const targetExists = this.translations.has(newKey) || keysCreatedDuringRename.has(newKey);
      const isNoOp = oldKey === newKey;
      const oldKeyStillNeeded = !!valueChanges[oldKey];

      if ((!targetExists || isNoOp) && !oldKeyStillNeeded) {
        deduplicated[oldKey] = newKey;
        keysCreatedDuringRename.add(newKey);
      } else if (targetExists && !isNoOp && keysCreatedDuringRename.has(newKey)) {
        multipleToOneKeys.add(newKey);
      }
    });

    return {
      deduplicatedKeyChanges: deduplicated,
      keysWithMultipleToOneRename: Array.from(multipleToOneKeys),
    };
  }

  /**
   * Calculates which keys should be removed.
   * Keys in valueChanges are ALWAYS protected from deletion.
   */
  private calculateKeysToRemove(
    originalKeyChanges: { [oldKey: string]: string },
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

  /**
   * Applies rename operations by moving translations from old key to new key.
   */
  private applyRenames(deduplicatedKeyChanges: { [oldKey: string]: string }): void {
    Object.entries(deduplicatedKeyChanges).forEach(([oldKey, newKey]) => {
      const oldTranslations = this.translations.get(oldKey);
      if (oldTranslations) {
        this.translations.set(newKey, oldTranslations);

        oldTranslations.forEach((translation, language) => {
          oldTranslations.set(
            language,
            new Translation(newKey, translation.value, language, this.contextInfo)
          );
        });
      }
    });
  }

  /**
   * Updates the default language translation value to match the key name for renamed keys.
   */
  private updateDefaultLanguageForRenames(newKeys: string[]): void {
    newKeys.forEach(newKey => {
      const langMap = this.translations.get(newKey);
      if (langMap) {
        langMap.set(
          this.defaultLanguage,
          new Translation(newKey, newKey, this.defaultLanguage, this.contextInfo)
        );
      }
    });
  }

  /**
   * For multiple-to-one renames, create fresh translations with key as value for all languages.
   */
  private updateAllLanguagesForKeys(keys: string[]): void {
    keys.forEach(key => {
      const langMap = new Map<LanguageISO6391, Translation>();
      this.languages.forEach(language => {
        langMap.set(language, new Translation(key, key, language, this.contextInfo));
      });
      this.translations.set(key, langMap);
    });
  }

  /**
   * Creates missing keys that don't exist in the database yet.
   * For renamed keys that are missing, uses the old key. For new keys, uses the key itself.
   */
  private createMissingKeys(valueChanges: { [key: string]: string }): void {
    Object.entries(valueChanges).forEach(([key, value]) => {
      if (!this.translations.has(key)) {
        const langMap = new Map<LanguageISO6391, Translation>();

        this.languages.forEach(language => {
          langMap.set(language, new Translation(key, value, language, this.contextInfo));
        });

        this.translations.set(key, langMap);
      }
    });
  }

  private deleteKeys(keysToRemove: string[]): void {
    keysToRemove.forEach(key => {
      this.translations.delete(key);
    });
  }

  getDiff(): TranslationContextDiff {
    const addedTranslations: Translation[] = [];
    const updatedTranslations: Translation[] = [];
    const deletedKeys: string[] = [];

    this.translations.forEach((langMap, key) => {
      const originalLangMap = this.originalTranslations.get(key);

      langMap.forEach((translation, language) => {
        const originalTranslation = originalLangMap?.get(language);

        if (!originalTranslation) {
          addedTranslations.push(translation);
        } else if (
          originalTranslation.value !== translation.value ||
          originalTranslation.key !== translation.key
        ) {
          updatedTranslations.push(translation);
        }
      });
    });

    this.originalTranslations.forEach((_, key) => {
      if (!this.translations.has(key)) {
        deletedKeys.push(key);
      }
    });

    const contextLabelChanged = this.originalContextLabel !== this.contextInfo.label;

    return new TranslationContextDiff(
      addedTranslations,
      updatedTranslations,
      deletedKeys,
      contextLabelChanged
    );
  }

  getAllTranslations(): Translation[] {
    const allTranslations: Translation[] = [];
    this.translations.forEach(langMap => {
      langMap.forEach(translation => {
        allTranslations.push(translation);
      });
    });
    return allTranslations;
  }

  getContextInfo(): TranslationContext {
    return this.contextInfo;
  }

  hasChanges(): boolean {
    return this.getDiff().hasChanges();
  }
}
