import { AbstractUseCase } from '../libs/UseCase.js';
import { TranslationsDataSource } from './contracts/TranslationsDataSource.js';
import { Translation } from '../domain/translation/Translation.js';
import {
  TranslationEntryInput,
  ValidateTranslationsService,
} from './translation/ValidateTranslationsService.js';

type Input = {
  translations: TranslationEntryInput[];
};

type Output = Translation[];

type Deps = {
  translationsDS: TranslationsDataSource;
  validateTranslations: ValidateTranslationsService;
};

/**
 * Updates values for translation entries that already exist.
 * Rejects when any key/context is missing in the store for the requested languages.
 */
class UpdateTranslationEntriesUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ translations }: Input): Promise<Output> {
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

    const models = translations.map(
      translation =>
        new Translation(
          translation.key,
          translation.value,
          translation.language,
          translation.context
        )
    );

    // Persistence uses replace-by-unique-key for existing rows only (validated above).
    return this.transactionManager.run(async () => this.deps.translationsDS.upsert(models));
  }
}

export { UpdateTranslationEntriesUseCase };
export type { Input as UpdateTranslationEntriesInput };
