import { AbstractUseCase } from '../libs/UseCase.js';
import { runInTransaction } from '../libs/runInTransaction.js';
import { TranslationsDataSource } from './contracts/TranslationsDataSource.js';
import { TranslationContext } from '../domain/translation/Translation.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';

type Input = {
  context: TranslationContext;
  keyChanges: Record<string, string>;
  keysToDelete: string[];
  valueChanges: Record<string, string>;
};

type Output = void;

type Deps = {
  translationsDS: TranslationsDataSource;
  settingsDS: SettingsDataSource;
};

class UpdateTranslationContextUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ context, keyChanges, keysToDelete, valueChanges }: Input): Promise<Output> {
    const languages = await this.deps.settingsDS.getLanguageKeys();
    const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();

    await runInTransaction(this.transactionManager, async () => {
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
