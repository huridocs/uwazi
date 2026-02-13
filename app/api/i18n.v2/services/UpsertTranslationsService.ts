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
   * - For multiple-to-one renames, first rename wins, subsequent ones are skipped
   */
  async updateContext(
    context: CreateTranslationsData['context'],
    keyChanges: { [oldKey: string]: string },
    valueChanges: { [key: string]: string },
    keysToDelete: string[]
  ) {
    const languages = await this.settingsDS.getLanguageKeys();
    const defaultLanguage = await this.settingsDS.getDefaultLanguageKey();

    const translationContext = await this.translationsDS.getContext(
      context,
      languages,
      defaultLanguage
    );

    translationContext.applyChanges(keyChanges, valueChanges, keysToDelete);

    await this.translationsDS.updateContext(translationContext);
  }
}
