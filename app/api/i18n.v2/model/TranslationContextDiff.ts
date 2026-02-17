import { Translation } from './Translation';

/**
 * Represents the differences between two states of a TranslationContext.
 * Used to optimize database persistence by only applying necessary changes.
 */
export class TranslationContextDiff {
  readonly addedTranslations: Translation[];

  readonly updatedTranslations: Translation[];

  readonly deletedKeys: string[];

  readonly contextLabelChanged: boolean;

  constructor(
    addedTranslations: Translation[],
    updatedTranslations: Translation[],
    deletedKeys: string[],
    contextLabelChanged: boolean
  ) {
    this.addedTranslations = addedTranslations;
    this.updatedTranslations = updatedTranslations;
    this.deletedKeys = deletedKeys;
    this.contextLabelChanged = contextLabelChanged;
  }

  hasChanges(): boolean {
    return (
      this.addedTranslations.length > 0 ||
      this.updatedTranslations.length > 0 ||
      this.deletedKeys.length > 0 ||
      this.contextLabelChanged
    );
  }
}
