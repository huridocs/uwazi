import { AbstractUseCase } from '../libs/UseCase.js';
import { TranslationsDataSource } from './contracts/TranslationsDataSource.js';
import { TranslationContext } from '../domain/translation/Translation.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';

type Input = {
  context: TranslationContext;
  keyChanges: Record<string, string>;
  keysToDelete: string[];
  /** Final key → default-language value map (source of truth for keys that should exist) */
  valueChanges: Record<string, string>;
};

type Output = void;

type Deps = {
  translationsDS: TranslationsDataSource;
  settingsDS: SettingsDataSource;
};

/**
 * Updates an existing translation context: renames, value changes, and deletions.
 */
class UpdateTranslationContextUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ context, keyChanges, keysToDelete, valueChanges }: Input): Promise<Output> {
    const languages = await this.deps.settingsDS.getLanguageKeys();
    const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();

    await this.transactionManager.run(async () => {
      const translationContext = await this.deps.translationsDS.getContext(
        context,
        languages,
        defaultLanguage
      );
      translationContext.applyChanges(keyChanges, valueChanges, keysToDelete);
      await this.deps.translationsDS.updateContext(translationContext);
    });
  }
}

export { UpdateTranslationContextUseCase };
export type { Input as UpdateTranslationContextInput };
