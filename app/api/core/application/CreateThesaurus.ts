import { CreateThesaurusProps, Thesaurus } from '../domain/thesaurus/Thesaurus.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { ThesauriService } from './ThesauriService.js';

type Input = CreateThesaurusProps;

type Output = Thesaurus;

type Deps = {
  thesauriService: ThesauriService;
};

class CreateThesaurusUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const thesaurus = Thesaurus.create(input);

    await this.transactionManager.run(async () => {
      await this.deps.thesauriService.insert(thesaurus);
    });

    return thesaurus;
  }
}

export { CreateThesaurusUseCase };
export type { Input as CreateThesaurusUseCaseInput };
