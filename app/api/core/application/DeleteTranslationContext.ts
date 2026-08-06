import { AbstractUseCase } from '../libs/UseCase.js';
import { TranslationsDataSource } from './contracts/TranslationsDataSource.js';

type Input = {
  contextId: string;
};

type Output = void;

type Deps = {
  translationsDS: TranslationsDataSource;
};

class DeleteTranslationContextUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ contextId }: Input): Promise<Output> {
    await this.transactionManager.run(async () => {
      await this.deps.translationsDS.deleteByContextId(contextId);
    });
  }
}

export { DeleteTranslationContextUseCase };
export type { Input as DeleteTranslationContextInput };
