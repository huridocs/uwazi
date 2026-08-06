import { AbstractUseCase } from '../libs/UseCase.js';
import { TranslationsDataSource } from './contracts/TranslationsDataSource.js';
import { Translation, TranslationContext } from '../domain/translation/Translation.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';

type Input = {
  context: TranslationContext;
  /** key → default value (typically the key itself for new contexts) */
  values: Record<string, string>;
};

type Output = void;

type Deps = {
  translationsDS: TranslationsDataSource;
  settingsDS: SettingsDataSource;
};

/**
 * Creates a full translation context for every installed language.
 */
class CreateTranslationContextUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ context, values }: Input): Promise<Output> {
    const languages = await this.deps.settingsDS.getLanguageKeys();
    const entries: Translation[] = [];

    languages.forEach(language => {
      Object.entries(values).forEach(([key, value]) => {
        entries.push(new Translation(key, value, language, context));
      });
    });

    await this.transactionManager.run(async () => {
      await this.deps.translationsDS.insert(entries);
    });
  }
}

export { CreateTranslationContextUseCase };
export type { Input as CreateTranslationContextInput };
