import { CreateThesaurusProps, Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';

type Input = CreateThesaurusProps;

type Output = Thesaurus;

type Deps = {
  thesauriDS: ThesauriDataSource;
  thesaurusTranslationService: ThesaurusTranslationService;
};

class CreateThesaurusUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const thesaurus = Thesaurus.create(input);

    (await this.deps.thesauriDS.exists(thesaurus.name)).getDataOrThrow();

    await this.transactionManager.run(async () => {
      await this.deps.thesauriDS.create(thesaurus);
      await this.deps.thesaurusTranslationService.create(thesaurus);
    });

    return thesaurus;
  }
}

export { CreateThesaurusUseCase };
export type { Input as CreateThesaurusUseCaseInput };
