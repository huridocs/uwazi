import { CreateThesaurusProps, Thesaurus } from '../domain/thesaurus/Thesaurus';
import { AbstractUseCase } from '../libs/UseCase';
import { ThesauriDataSource } from './contracts/ThesauriDataSource';

type Input = CreateThesaurusProps;

type Output = Thesaurus;

type Deps = {
  thesauriDS: ThesauriDataSource;
};

class CreateThesaurusUseCase extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync(input: Input): Promise<Output> {
    const thesaurus = Thesaurus.create(input);

    (await this.deps.thesauriDS.exists(thesaurus.name)).getDataOrThrow();

    await this.deps.thesauriDS.create(thesaurus);

    return thesaurus;
  }
}

export { CreateThesaurusUseCase };
export type { Input as CreateThesaurusUseCaseInput };
