import { Thesaurus, UpdateThesaurusProps } from '../domain/thesaurus/Thesaurus.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { ThesauriDataSource } from './contracts/ThesauriDataSource.js';
import { ThesauriService } from './ThesauriService.js';
import { ThesaurusTranslationService } from './thesaurusTranslationService/ThesaurusTranslationService.js';

type Input = {
  id: string;
  name: string;
  values: Required<UpdateThesaurusProps['values']>;
};

type Output = Thesaurus;

type Deps = {
  thesauriDS: ThesauriDataSource;
  thesaurusTranslationService: ThesaurusTranslationService;
  thesauriService: ThesauriService;
};

class UpdateThesaurusUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const existing = (await this.deps.thesauriDS.getById(input.id)).getDataOrThrow();

    const updated = existing.update({
      name: input.name,
      values: input.values,
    });

    await this.transactionManager.run(async () =>
      this.deps.thesauriService.update(updated, {
        tenantName: this.tenant.name,
        actorId: this.actorId,
      })
    );

    return updated;
  }
}

export { UpdateThesaurusUseCase };
export type { Input as UpdateThesaurusUseCaseInput };
