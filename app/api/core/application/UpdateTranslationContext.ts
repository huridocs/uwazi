import { AbstractUseCase } from '../libs/UseCase.js';
import { TranslationContext } from '../domain/translation/Translation.js';
import { TranslationsService } from './translation/TranslationsService.js';

type Input = {
  context: TranslationContext;
  keyChanges: Record<string, string>;
  keysToDelete: string[];
  valueChanges: Record<string, string>;
};

type Output = void;

type Deps = {
  translationsService: TranslationsService;
};

class UpdateTranslationContextUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ context, keyChanges, keysToDelete, valueChanges }: Input): Promise<Output> {
    await this.transactionManager.run(async () => {
      await this.deps.translationsService.updateContext({
        context,
        keyChanges,
        keysToDelete,
        valueChanges,
      });
    });
  }
}

export { UpdateTranslationContextUseCase };
export type { Input as UpdateTranslationContextInput };
