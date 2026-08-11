import { AbstractUseCase } from '../libs/UseCase.js';
import { TranslationContext } from '../domain/translation/Translation.js';
import { TranslationsService } from './translation/TranslationsService.js';

type Input = {
  context: TranslationContext;
  values: Record<string, string>;
};

type Output = void;

type Deps = {
  translationsService: TranslationsService;
};

class CreateTranslationContextUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ context, values }: Input): Promise<Output> {
    await this.transactionManager.run(async () => {
      await this.deps.translationsService.createContext(context, values);
    });
  }
}

export { CreateTranslationContextUseCase };
export type { Input as CreateTranslationContextInput };
