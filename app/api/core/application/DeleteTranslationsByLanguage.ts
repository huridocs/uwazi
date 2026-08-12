import { AbstractUseCase } from '../libs/UseCase.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TranslationsService } from './translation/TranslationsService.js';

type Input = {
  language: LanguageISO6391;
};

type Output = void;

type Deps = {
  translationsService: TranslationsService;
};

class DeleteTranslationsByLanguageUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ language }: Input): Promise<Output> {
    await this.transactionManager.run(async () => {
      await this.deps.translationsService.deleteByLanguage(language);
    });
  }
}

export { DeleteTranslationsByLanguageUseCase };
export type { Input as DeleteTranslationsByLanguageInput };
