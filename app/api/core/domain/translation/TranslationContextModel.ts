import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { Translation, TranslationContext } from './Translation.js';
import { TranslationContextDiff } from './TranslationContextDiff.js';
import {
  TranslationIndex,
  buildTranslationIndex,
  calculateKeysToRemove,
  cloneTranslationIndex,
  deduplicateKeyChanges,
} from './translationContextIndex.js';

export class TranslationContextModel {
  private contextInfo: TranslationContext;

  private translations: TranslationIndex;

  private languages: LanguageISO6391[];

  private defaultLanguage: LanguageISO6391;

  private originalTranslations: TranslationIndex;

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

    this.translations = buildTranslationIndex(translations);
    this.originalTranslations = cloneTranslationIndex(this.translations);

    this.originalContextLabel =
      translations.length > 0 ? translations[0].context.label : contextInfo.label;
  }

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

  applyChanges(
    keyChanges: { [oldKey: string]: string },
    valueChanges: { [key: string]: string },
    keysToDelete: string[]
  ): void {
    const { deduplicatedKeyChanges, keysWithMultipleToOneRename } = deduplicateKeyChanges(
      this.translations,
      keyChanges,
      valueChanges
    );

    const keysToRemove = calculateKeysToRemove(keyChanges, keysToDelete, valueChanges);

    this.applyRenames(deduplicatedKeyChanges);
    this.updateDefaultLanguageForRenames(Object.values(deduplicatedKeyChanges));

    if (keysWithMultipleToOneRename.length > 0) {
      this.updateAllLanguagesForKeys(keysWithMultipleToOneRename);
    }

    this.createMissingKeys(valueChanges);
    this.deleteKeys(keysToRemove);
  }

  private applyRenames(deduplicatedKeyChanges: { [oldKey: string]: string }): void {
    Object.entries(deduplicatedKeyChanges).forEach(([oldKey, newKey]) => {
      const oldTranslations = this.translations.get(oldKey);
      if (!oldTranslations) {
        return;
      }

      this.translations.set(newKey, oldTranslations);
      oldTranslations.forEach((translation, language) => {
        oldTranslations.set(
          language,
          new Translation(newKey, translation.value, language, this.contextInfo)
        );
      });
    });
  }

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

  private updateAllLanguagesForKeys(keys: string[]): void {
    keys.forEach(key => {
      const langMap = new Map<LanguageISO6391, Translation>();
      this.languages.forEach(language => {
        langMap.set(language, new Translation(key, key, language, this.contextInfo));
      });
      this.translations.set(key, langMap);
    });
  }

  private createMissingKeys(valueChanges: { [key: string]: string }): void {
    Object.entries(valueChanges).forEach(([key, value]) => {
      if (this.translations.has(key)) {
        return;
      }

      const langMap = new Map<LanguageISO6391, Translation>();
      this.languages.forEach(language => {
        langMap.set(language, new Translation(key, value, language, this.contextInfo));
      });
      this.translations.set(key, langMap);
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

    return new TranslationContextDiff(
      addedTranslations,
      updatedTranslations,
      deletedKeys,
      this.originalContextLabel !== this.contextInfo.label
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
