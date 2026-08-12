import { AbstractUseCase } from '../libs/UseCase.js';
import { Translation } from '../domain/translation/Translation.js';
import { TranslationEntryInput } from './translation/ValidateTranslationsService.js';
import { TranslationsService } from './translation/TranslationsService.js';

type Input = {
  translations: TranslationEntryInput[];
};

type Output = Translation[];

type Deps = {
  translationsService: TranslationsService;
};

class UpdateTranslationEntriesUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ translations }: Input): Promise<Output> {
    return this.transactionManager.run(async () =>
      this.deps.translationsService.upsertEntries(translations)
    );
  }
}

export { UpdateTranslationEntriesUseCase };
export type { Input as UpdateTranslationEntriesInput };
