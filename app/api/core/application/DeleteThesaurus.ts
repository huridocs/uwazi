import { ThesaurusNotFoundError, ThesaurusInUseError } from '../domain/thesaurus/errors.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { ThesauriDataSource } from './contracts/ThesauriDataSource.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';

type Input = {
  thesaurusId: string;
};

type Deps = {
  thesauriDS: ThesauriDataSource;
  translationsDS: TranslationsDataSource;
  templatesDS: TemplatesDataSource;
};

class DeleteThesaurusUseCase extends AbstractUseCase<Input, void, Deps> {
  async execute(input: Input): Promise<void> {
    const existing = await this.deps.thesauriDS.getById(input.thesaurusId);
    existing.getDataOrThrow();

    const count = await this.deps.templatesDS.countByThesauri(input.thesaurusId);
    if (count > 0) {
      throw new ThesaurusInUseError(count);
    }

    await this.transactionManager.run(async () => {
      await this.deps.translationsDS.deleteByContextId(input.thesaurusId);
      await this.deps.thesauriDS.delete(input.thesaurusId);
    });
  }
}

export { DeleteThesaurusUseCase };
export type { Input as DeleteThesaurusInput };
