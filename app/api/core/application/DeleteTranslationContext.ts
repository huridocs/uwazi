import { AbstractUseCase } from '../libs/UseCase.js';
import { TranslationsService } from './translation/TranslationsService.js';

type Input = {
  contextId: string;
};

type Output = void;

type Deps = {
  translationsService: TranslationsService;
};

class DeleteTranslationContextUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ contextId }: Input): Promise<Output> {
    await this.transactionManager.run(async () => {
      await this.deps.translationsService.deleteByContextId(contextId);
    });
  }
}

export { DeleteTranslationContextUseCase };
export type { Input as DeleteTranslationContextInput };
