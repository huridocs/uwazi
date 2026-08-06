import { AbstractUseCase } from '../libs/UseCase.js';
import { runInTransaction } from '../libs/runInTransaction.js';
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

class CreateTranslationEntriesUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ translations }: Input): Promise<Output> {
    await this.deps.validateTranslations.languagesExist(translations);
    await this.deps.validateTranslations.translationsWillExistsInAllLanguages(translations);

    return runInTransaction(this.transactionManager, async () =>
      this.deps.translationsDS.insert(
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
}

export { CreateTranslationEntriesUseCase };
export type { Input as CreateTranslationEntriesInput };
