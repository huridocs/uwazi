import { AbstractUseCase } from '../libs/UseCase.js';
import { runInTransaction } from '../libs/runInTransaction.js';
import { TranslationsDataSource } from './contracts/TranslationsDataSource.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

type Input = {
  language: LanguageISO6391;
};

type Output = void;

type Deps = {
  translationsDS: TranslationsDataSource;
};

class DeleteTranslationsByLanguageUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ language }: Input): Promise<Output> {
    await runInTransaction(this.transactionManager, async () => {
      await this.deps.translationsDS.deleteByLanguage(language);
    });
  }
}

export { DeleteTranslationsByLanguageUseCase };
export type { Input as DeleteTranslationsByLanguageInput };
