import { Thesaurus, UpdateThesaurusProps } from '../domain/thesaurus/Thesaurus';
import { ThesaurusDiff } from '../domain/thesaurus/ThesaurusDiff';
import { DenormalizeThesaurusEntitiesHandler } from '../infrastructure/jobs/DenormalizeThesaurusEntitiesHandler';
import { AbstractUseCase } from '../libs/UseCase';
import { ThesauriDataSource } from './contracts/ThesauriDataSource';
import { ThesaurusTranslationService } from './thesaurusTranslationService/ThesaurusTranslationService';

type Input = {
  id: string;
  name: string;
  values: Required<UpdateThesaurusProps['values']>;
};

type Output = Thesaurus;

type Deps = {
  thesauriDS: ThesauriDataSource;
  thesaurusTranslationService: ThesaurusTranslationService;
};

class UpdateThesaurusUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const existing = (await this.deps.thesauriDS.geyById(input.id)).getDataOrThrow();

    const updated = existing.update({
      name: input.name,
      values: input.values,
    });

    const diff = new ThesaurusDiff({ before: existing, after: updated });

    await this.transactionManager.run(async () => {
      await this.deps.thesauriDS.update(updated);
      await this.deps.thesaurusTranslationService.update(diff);
      await this.jobsDispatcher.deleteByParams<DenormalizeThesaurusEntitiesHandler>({
        thesaurusId: updated.id,
      });
      await this.jobsDispatcher.dispatch(DenormalizeThesaurusEntitiesHandler, {
        tenantName: this.tenant.name,
        thesaurusId: updated.id,
        userId: this.actorId,
      });
    });

    return updated;
  }
}

export { UpdateThesaurusUseCase };
export type { Input as UpdateThesaurusUseCaseInput };
